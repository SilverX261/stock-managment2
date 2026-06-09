'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Download, Upload, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, ChevronRight } from 'lucide-react'
import type { LaptopInsert } from '@/types/database'

const TEMPLATE_HEADERS = ['Brand','Model','Processor','RAM GB','Storage GB','Storage Type','Display Size','Condition','Cost Price PKR','Sell Price PKR','Quantity','Notes','Serial Number']
const EXAMPLE_ROW = ['Dell','Latitude 5420','Intel Core i5-1145G7',8,256,'SSD',14,'new',85000,95000,5,'Fresh stock','SN1234567890']
const VALID_STORAGE = ['SSD','HDD','NVMe'] as const
const VALID_CONDITION = ['new','used','refurbished'] as const
const STEP_LABELS = ['Upload File','Preview & Validate','Import Done']
const STEPS: Step[] = ['upload','preview','done']
type Step = 'upload' | 'preview' | 'done'

interface ParsedRow {
  rowNum: number; brand: string; model: string; processor: string; ramGb: string; storageGb: string
  storageType: string; displaySize: string; condition: string; costPrice: string; sellPrice: string
  quantity: string; notes: string; serialNumber: string; errors: string[]; data: LaptopInsert | null
}

function parseRow(raw: Record<string,unknown>, rowNum: number): ParsedRow {
  const str = (k: string) => String(raw[k] ?? '').trim()
  const num = (k: string): number | null => { const v = raw[k]; if (v === undefined || v === null || v === '') return null; const n = Number(v); return isNaN(n) ? null : n }
  const brand = str('Brand'), model = str('Model'), processor = str('Processor'), ramGb = str('RAM GB'), storageGb = str('Storage GB')
  const storageType = str('Storage Type'), displaySize = str('Display Size'), conditionRaw = str('Condition').toLowerCase()
  const costPrice = str('Cost Price PKR'), sellPrice = str('Sell Price PKR'), quantity = str('Quantity'), notes = str('Notes')
  const serialNumber = str('Serial Number')
  const errors: string[] = []
  if (!brand) errors.push('Brand is required')
  if (!model) errors.push('Model is required')
  const ramNum = num('RAM GB'); if (ramNum === null || ramNum <= 0) errors.push('RAM GB must be a positive number')
  const storageNum = num('Storage GB'); if (storageNum === null || storageNum <= 0) errors.push('Storage GB must be a positive number')
  if (!VALID_STORAGE.includes(storageType as 'SSD'|'HDD'|'NVMe')) errors.push(`Storage Type must be: ${VALID_STORAGE.join(', ')}`)
  const condition = VALID_CONDITION.includes(conditionRaw as 'new'|'used'|'refurbished') ? (conditionRaw as 'new'|'used'|'refurbished') : null
  if (!condition) errors.push(`Condition must be: ${VALID_CONDITION.join(', ')}`)
  const costNum = num('Cost Price PKR'); if (costNum === null || costNum <= 0) errors.push('Cost Price PKR must be a positive number')
  const displayNum = num('Display Size'), sellNum = num('Sell Price PKR'), qtyNum = num('Quantity')
  const data: LaptopInsert | null = errors.length === 0 ? {
    brand, model, processor: processor || null, base_ram_gb: Math.round(ramNum!), base_storage_gb: Math.round(storageNum!),
    storage_type: storageType as 'SSD'|'HDD'|'NVMe', display_size: displayNum, condition: condition!,
    cost_price: Math.round(costNum!), sell_price: sellNum != null ? Math.round(sellNum) : null,
    quantity: qtyNum != null ? Math.round(Math.max(0, qtyNum)) : 0, notes: notes || null,
    serial_number: serialNumber || null,
  } : null
  return { rowNum, brand, model, processor, ramGb, storageGb, storageType, displaySize, condition: conditionRaw, costPrice, sellPrice, quantity, notes, serialNumber, errors, data }
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, EXAMPLE_ROW])
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Laptops')
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([out], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'fine_computers_laptop_import.xlsx'; a.click(); URL.revokeObjectURL(url)
}

const OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const MODAL: React.CSSProperties = { backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: 760, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }

interface Props { open: boolean; onOpenChange: (v: boolean) => void; onImported: () => void }

export function BulkImportModal({ open, onOpenChange, onImported }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const fileRef  = useRef<HTMLInputElement>(null)
  const [step,         setStep]        = useState<Step>('upload')
  const [rows,         setRows]        = useState<ParsedRow[]>([])
  const [importing,    setImporting]   = useState(false)
  const [summary,      setSummary]     = useState<{ imported: number; skipped: number } | null>(null)
  const [importError,  setImportError] = useState<string | null>(null)
  const [dragging,     setDragging]    = useState(false)

  function reset() { setStep('upload'); setRows([]); setSummary(null); setImportError(null); if (fileRef.current) fileRef.current.value = '' }
  function close() { reset(); onOpenChange(false) }

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws) as Record<string,unknown>[]
      setRows(raw.map((r, i) => parseRow(r, i + 2)))
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) parseFile(file) }
  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file && /\.(xlsx|xls)$/i.test(file.name)) parseFile(file) }

  async function handleImport() {
    const valid = rows.filter(r => r.data !== null).map(r => r.data!)
    if (!valid.length) return
    setImporting(true); setImportError(null)
    let imported = 0
    for (let i = 0; i < valid.length; i += 50) {
      const { error } = await supabase.from('laptops').insert(valid.slice(i, i + 50))
      if (error) { setImportError(error.message); setImporting(false); return }
      imported += Math.min(50, valid.length - i)
    }
    setSummary({ imported, skipped: rows.filter(r => r.data === null).length })
    setStep('done'); setImporting(false); onImported()
  }

  const validCount = rows.filter(r => r.data !== null).length
  const errorCount = rows.filter(r => r.data === null).length
  const currentIdx = STEPS.indexOf(step)

  if (!open) return null

  return (
    <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div style={MODAL}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EEE8', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet style={{ width: 18, height: 18, color: '#A1A1AA' }} />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Import Laptops from Excel</h2>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '10px 24px', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FAFAF8', flexShrink: 0 }}>
          {STEPS.map((s, i) => {
            const isPast = i < currentIdx, isActive = i === currentIdx
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <ChevronRight style={{ width: 14, height: 14, margin: '0 6px', color: '#A1A1AA', flexShrink: 0 }} />}
                <span style={{
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#0A0A0A' : isPast ? '#F97316' : '#A1A1AA',
                }}>
                  {STEP_LABELS[i]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Download template */}
              <div style={{ borderRadius: 10, backgroundColor: '#FAFAF8', padding: 16, display: 'flex', alignItems: 'flex-start', gap: 16, border: '1px solid #F0EEE8' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Download style={{ width: 18, height: 18, color: '#047857' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Step 1 — Download the template</p>
                  <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 4, lineHeight: 1.5 }}>
                    Fill in your laptop data. <strong>Storage Type</strong> must be SSD, HDD, or NVMe. <strong>Condition</strong> must be new, used, or refurbished.
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} style={{ marginTop: 10 }}>
                    <Download style={{ width: 13, height: 13 }} /> Download Template (.xlsx)
                  </Button>
                </div>
              </div>

              {/* Drop zone */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', marginBottom: 12 }}>Step 2 — Upload your filled file</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  style={{
                    border: `2px dashed ${dragging ? '#F97316' : '#D1CECC'}`,
                    borderRadius: 12, padding: '48px 24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                    cursor: 'pointer', textAlign: 'center',
                    backgroundColor: dragging ? 'rgba(249,115,22,0.04)' : '#FAFAF8',
                    transition: 'border-color 150ms, background-color 150ms',
                  }}
                >
                  <Upload style={{ width: 32, height: 32, color: '#A1A1AA' }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>Click to upload or drag &amp; drop</p>
                    <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 4 }}>.xlsx or .xls files only</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onFileChange} />
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669' }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  {validCount} row{validCount !== 1 ? 's' : ''} ready to import
                </div>
                {errorCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#EF4444' }}>
                    <XCircle style={{ width: 16, height: 16 }} />
                    {errorCount} row{errorCount !== 1 ? 's' : ''} with errors — will be skipped
                  </div>
                )}
              </div>

              {importError && (
                <div style={{ fontSize: 13, color: '#EF4444', backgroundColor: '#FEE2E2', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} /> {importError}
                </div>
              )}

              {/* Preview table */}
              <div style={{ border: '1px solid #F0EEE8', borderRadius: 10, overflow: 'auto', maxHeight: 340 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F5F2EC', position: 'sticky', top: 0, zIndex: 1 }}>
                      {['#','Brand','Model','RAM','Storage','Type','Cond.','Cost (PKR)','Sell (PKR)','Qty','Serial','Errors'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#A1A1AA', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const hasErr    = row.errors.length > 0
                      const badSt     = !VALID_STORAGE.includes(row.storageType as 'SSD'|'HDD'|'NVMe')
                      const badCond   = !VALID_CONDITION.includes(row.condition as 'new'|'used'|'refurbished')
                      return (
                        <tr key={row.rowNum} style={{ backgroundColor: hasErr ? '#FEF2F2' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAF8', borderTop: '1px solid #F0EEE8' }}>
                          <td style={{ padding: '7px 12px', color: '#A1A1AA' }}>{row.rowNum}</td>
                          <td style={{ padding: '7px 12px', fontWeight: 500, color: row.brand ? '#0A0A0A' : '#EF4444', whiteSpace: 'nowrap' }}>{row.brand || '—'}</td>
                          <td style={{ padding: '7px 12px', color: row.model ? '#0A0A0A' : '#EF4444', whiteSpace: 'nowrap' }}>{row.model || '—'}</td>
                          <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>{row.ramGb || '—'}</td>
                          <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>{row.storageGb || '—'}</td>
                          <td style={{ padding: '7px 12px', color: badSt ? '#EF4444' : '#0A0A0A', fontWeight: badSt ? 600 : 400, whiteSpace: 'nowrap' }}>{row.storageType || '—'}</td>
                          <td style={{ padding: '7px 12px', color: badCond ? '#EF4444' : '#0A0A0A', fontWeight: badCond ? 600 : 400, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{row.condition || '—'}</td>
                          <td style={{ padding: '7px 12px', color: row.costPrice ? '#0A0A0A' : '#EF4444', whiteSpace: 'nowrap' }}>{row.costPrice || '—'}</td>
                          <td style={{ padding: '7px 12px', color: '#A1A1AA', whiteSpace: 'nowrap' }}>{row.sellPrice || '—'}</td>
                          <td style={{ padding: '7px 12px' }}>{row.quantity || '0'}</td>
                          <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 11, color: row.serialNumber ? '#3F3F46' : '#D4D2CB', whiteSpace: 'nowrap' }}>{row.serialNumber || '—'}</td>
                          <td style={{ padding: '7px 12px', minWidth: 140 }}>
                            {hasErr ? (
                              <ul style={{ color: '#EF4444' }}>
                                {row.errors.map((e, i) => <li key={i} style={{ fontSize: 11, marginBottom: 2 }}>• {e}</li>)}
                              </ul>
                            ) : (
                              <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                <CheckCircle2 style={{ width: 12, height: 12 }} /> Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && summary && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: '#047857' }} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Import Complete</p>
                <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 6 }}>
                  <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{summary.imported}</span> laptop{summary.imported !== 1 ? 's' : ''} imported successfully
                  {summary.skipped > 0 && <> — <span style={{ fontWeight: 600, color: '#EF4444' }}>{summary.skipped}</span> row{summary.skipped !== 1 ? 's' : ''} skipped</>}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 24px', borderTop: '1px solid #F0EEE8', flexShrink: 0 }}>
          <Button variant="outline" onClick={close}>{step === 'done' ? 'Close' : 'Cancel'}</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {step === 'preview' && <Button variant="ghost" size="sm" onClick={reset}>Upload different file</Button>}
            {step === 'preview' && validCount > 0 && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <><span className="fc-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />Importing…</>
                ) : `Import ${validCount} laptop${validCount !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Lightbulb, ArrowRight, Camera } from 'lucide-react'
import { SerialScanModal } from '@/components/scan/serial-scan-modal'
import type { Laptop, LaptopInsert } from '@/types/database'

type FormData = Omit<LaptopInsert,'id'|'created_at'|'updated_at'|'supplier_id'|'sell_price'> & { sell_price: number | null; serial_number: string | null }
const EMPTY: FormData = { brand:'', model:'', processor:'', base_ram_gb:8, base_storage_gb:256, storage_type:'SSD', display_size:15.6, condition:'new', cost_price:0, sell_price:null, quantity:1, notes:'', serial_number:null }

function fromInitial(l: Laptop): FormData {
  return { brand:l.brand, model:l.model, processor:l.processor??'', base_ram_gb:l.base_ram_gb, base_storage_gb:l.base_storage_gb, storage_type:l.storage_type, display_size:l.display_size??15.6, condition:l.condition, cost_price:l.cost_price, sell_price:l.sell_price, quantity:l.quantity, notes:l.notes??'', serial_number:l.serial_number??null }
}

function useDebounce<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t) }, [value, ms])
  return d
}

interface PriceSug { avg: number; min: number; max: number; count: number }
interface Props { open: boolean; onOpenChange: (v: boolean) => void; initial?: Laptop | null; onSave: (data: FormData, id?: string) => Promise<void> }

const LBL: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#3F3F46', marginBottom: 6 }
const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column' }

export function LaptopForm({ open, onOpenChange, initial, onSave }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [form, setForm] = useState<FormData>(() => initial ? fromInitial(initial) : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sug, setSug] = useState<PriceSug | null>(null)
  const [loadingSug, setLoadingSug] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const dBrand = useDebounce(form.brand, 600)
  const dModel = useDebounce(form.model, 600)

  function handleOpenChange(v: boolean) {
    if (!v) { setError(null); setSug(null) } else { setForm(initial ? fromInitial(initial) : EMPTY) }
    onOpenChange(v)
  }

  function set<K extends keyof FormData>(key: K, value: FormData[K]) { setForm(prev => ({ ...prev, [key]: value })) }

  useEffect(() => {
    const brand = dBrand.trim(), model = dModel.trim()
    if (brand.length < 2 || model.length < 2) { setSug(null); return }
    let cancelled = false
    async function fetchSug() {
      setLoadingSug(true)
      const firstWord = model.split(' ')[0]
      const { data: matching } = await supabase.from('laptops').select('id').ilike('brand', brand).ilike('model', `%${firstWord}%`).limit(50)
      if (cancelled) return
      if (!matching?.length) { setSug(null); setLoadingSug(false); return }
      const ids = matching.map((l: { id: string }) => l.id)
      const { data: saleItems } = await supabase.from('sale_items').select('sell_price_snapshot').eq('item_type','laptop').in('laptop_id', ids).gt('sell_price_snapshot', 0).limit(30)
      if (cancelled) return
      if (!saleItems?.length) { setSug(null); setLoadingSug(false); return }
      const prices = (saleItems as { sell_price_snapshot: number }[]).map(s => s.sell_price_snapshot)
      setSug({ avg: Math.round(prices.reduce((s,p) => s+p, 0) / prices.length), min: Math.min(...prices), max: Math.max(...prices), count: prices.length })
      setLoadingSug(false)
    }
    fetchSug()
    return () => { cancelled = true }
  }, [dBrand, dModel, supabase])

  const hasSell = form.sell_price !== null && form.sell_price > 0
  const profit = hasSell ? (form.sell_price as number) - form.cost_price : null
  const margin = hasSell && profit !== null && (form.sell_price as number) > 0 ? ((profit / (form.sell_price as number)) * 100).toFixed(1) : null
  const fmt = (n: number) => n.toLocaleString('en-PK')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brand.trim() || !form.model.trim()) { setError('Brand and Model are required.'); return }
    if (form.cost_price <= 0) { setError('Cost price must be greater than 0.'); return }
    setSaving(true); setError(null)
    try { await onSave(form, initial?.id); onOpenChange(false) }
    catch (err) { setError((err as { message?: string })?.message ?? 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Laptop' : 'Add Laptop'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div style={G2}>
            <div style={FIELD}><label style={LBL}>Brand *</label><Input placeholder="Dell, HP, Lenovo…" style={{ height: 44 }} value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
            <div style={FIELD}><label style={LBL}>Model *</label><Input placeholder="Latitude 5420" style={{ height: 44 }} value={form.model} onChange={e => set('model', e.target.value)} /></div>
          </div>
          <div style={FIELD}><label style={LBL}>Processor</label><Input placeholder="Intel Core i5-11th Gen" style={{ height: 44 }} value={form.processor ?? ''} onChange={e => set('processor', e.target.value)} /></div>
          <div style={G2}>
            <div style={FIELD}><label style={LBL}>RAM (GB)</label>
              <Select value={String(form.base_ram_gb)} onValueChange={v => set('base_ram_gb', Number(v))}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent>{[4,8,12,16,32].map(n => <SelectItem key={n} value={String(n)}>{n} GB</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div style={FIELD}><label style={LBL}>Storage</label>
              <Select value={String(form.base_storage_gb)} onValueChange={v => set('base_storage_gb', Number(v))}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent>{[128,256,512,1024,2048].map(n => <SelectItem key={n} value={String(n)}>{n >= 1024 ? `${n/1024} TB` : `${n} GB`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div style={G2}>
            <div style={FIELD}><label style={LBL}>Storage Type</label>
              <Select value={form.storage_type} onValueChange={v => set('storage_type', v as 'SSD'|'HDD'|'NVMe')}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SSD">SSD</SelectItem><SelectItem value="HDD">HDD</SelectItem><SelectItem value="NVMe">NVMe</SelectItem></SelectContent>
              </Select>
            </div>
            <div style={FIELD}><label style={LBL}>Display Size</label>
              <Select value={String(form.display_size)} onValueChange={v => set('display_size', Number(v))}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent>{[13,14,15.6,17].map(n => <SelectItem key={n} value={String(n)}>{n}&quot;</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div style={G2}>
            <div style={FIELD}><label style={LBL}>Condition</label>
              <Select value={form.condition} onValueChange={v => set('condition', v as 'new'|'used'|'refurbished')}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="used">Used</SelectItem><SelectItem value="refurbished">Refurbished</SelectItem></SelectContent>
              </Select>
            </div>
            <div style={FIELD}><label style={LBL}>Quantity</label><Input type="number" min={0} style={{ height: 44 }} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} /></div>
          </div>
          <div style={G2}>
            <div style={FIELD}><label style={LBL}>Cost Price (PKR) *</label><Input type="number" min={0} style={{ height: 44 }} value={form.cost_price || ''} placeholder="0" onChange={e => set('cost_price', Number(e.target.value))} /></div>
            <div style={FIELD}><label style={LBL}>Sell Price (PKR) <span style={{ fontSize: 11, fontWeight: 400, color: '#A1A1AA' }}>optional</span></label><Input type="number" min={0} style={{ height: 44 }} value={form.sell_price ?? ''} placeholder="Set later" onChange={e => set('sell_price', e.target.value ? Number(e.target.value) : null)} /></div>
          </div>

          {loadingSug && <p style={{ fontSize: 12, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 6 }}><span className="fc-spin" style={{ width: 12, height: 12, border: '2px solid #E4E2DC', borderTopColor: '#A1A1AA', borderRadius: '50%', display: 'inline-block' }} />Checking past sales…</p>}

          {sug && !loadingSug && (
            <div style={{ borderRadius: 10, backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}><Lightbulb style={{ width: 13, height: 13 }} />Price suggestion</p>
                  <p style={{ fontSize: 12, color: '#EA580C', lineHeight: 1.5 }}>Based on <strong>{sug.count} past sale{sug.count !== 1 ? 's' : ''}</strong>, avg <strong>PKR {fmt(sug.avg)}</strong> — high {fmt(sug.max)}, low {fmt(sug.min)}</p>
                </div>
                <Button type="button" size="sm" variant="outline" style={{ height: 28, fontSize: 12, flexShrink: 0, borderColor: '#FFEDD5', color: '#C2410C' }} onClick={() => set('sell_price', sug.avg)}>
                  Use {fmt(sug.avg)} <ArrowRight style={{ width: 11, height: 11 }} />
                </Button>
              </div>
            </div>
          )}

          {form.cost_price > 0 && hasSell && profit !== null && (
            <div style={{ borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, backgroundColor: profit >= 0 ? '#ECFDF5' : '#FEF2F2', color: profit >= 0 ? '#047857' : '#B91C1C' }}>
              <span>Profit</span>
              <span style={{ fontWeight: 600 }}>PKR {profit.toLocaleString('en-PK')} ({margin}%)</span>
            </div>
          )}

          <div style={FIELD}>
            <label style={LBL}>
              Serial Number <span style={{ fontSize: 11, fontWeight: 400, color: '#A1A1AA' }}>optional</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="e.g. SN1234567890"
                style={{ height: 44, flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                value={form.serial_number ?? ''}
                onChange={e => set('serial_number', e.target.value.trim() || null)}
              />
              <Button
                type="button"
                variant="outline"
                style={{ height: 44, paddingLeft: 14, paddingRight: 14, gap: 6, flexShrink: 0 }}
                onClick={() => setScanOpen(true)}
              >
                <Camera style={{ width: 15, height: 15 }} />
                Scan
              </Button>
            </div>
          </div>

          <div style={FIELD}><label style={LBL}>Notes</label><Textarea placeholder="Any additional notes…" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>

          {error && <p style={{ fontSize: 13, color: '#EF4444', backgroundColor: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

          <DialogFooter style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
            <Button type="button" variant="outline" style={{ height: 44 }} onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" style={{ height: 44, minWidth: 96 }} disabled={saving}>
              {saving ? <><span className="fc-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} /></> : initial ? 'Save Changes' : 'Add Laptop'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <SerialScanModal
      open={scanOpen}
      onOpenChange={setScanOpen}
      onScanned={text => set('serial_number', text.trim() || null)}
    />
    </>
  )
}

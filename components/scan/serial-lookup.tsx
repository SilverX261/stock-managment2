'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Camera, Search, CheckCircle2, XCircle, Monitor, MemoryStick,
  HardDrive, ShieldCheck, Shield, User, Phone, Calendar, Loader2,
  PackageX, AlertCircle, ScanText, ArrowRight, X, RotateCcw,
} from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('en-PK')
const pkr = (n: number) => `PKR ${fmt(n)}`

interface SaleInfo {
  id: string
  sale_date: string
  total_sell_price: number
  total_cost_price: number
  warranty_days: number
  specs_promised: string | null
  customer: { name: string; phone: string | null } | null
}

interface LaptopResult {
  id: string
  brand: string
  model: string
  processor: string | null
  base_ram_gb: number
  base_storage_gb: number
  storage_type: string
  display_size: number | null
  condition: string
  cost_price: number
  sell_price: number | null
  quantity: number
  serial_number: string | null
  notes: string | null
  sale_items: Array<{
    quantity: number
    sell_price_snapshot: number
    cost_price_snapshot: number
    sale: SaleInfo | null
  }>
}

const SCANNER_ID = 'fc-serial-scan-page'

const COND: Record<string, { bg: string; text: string }> = {
  new:         { bg: '#D1FAE5', text: '#047857' },
  used:        { bg: '#FEF3C7', text: '#B45309' },
  refurbished: { bg: '#CCFBF1', text: '#0F766E' },
}

function storageLabel(gb: number) {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`
}

function warrantyExpiryDate(saleDateStr: string, days: number): Date {
  const d = new Date(saleDateStr)
  d.setDate(d.getDate() + days)
  return d
}

function parseSerialCandidates(text: string): string[] {
  const found = new Set<string>()
  const upper = text.replace(/\s+/g, ' ').toUpperCase()

  const labeled = [
    /S[\/.]?N[#: ]+([A-Z0-9][A-Z0-9\-]{3,19})/g,
    /SERIAL\s*(?:NUMBER|NO\.?|NUM\.?|#)?[: ]+([A-Z0-9][A-Z0-9\-]{3,19})/g,
    /SNH[ ]+([A-Z0-9][A-Z0-9\-]{3,19})/g,
    /SERVICE\s*TAG[: ]+([A-Z0-9]{4,12})/g,
    /P\/N[: ]+([A-Z0-9][A-Z0-9\-]{5,19})/g,
  ]

  for (const pat of labeled) {
    let m: RegExpExecArray | null
    while ((m = pat.exec(upper)) !== null) {
      const c = m[1].replace(/[^A-Z0-9\-]+$/, '')
      if (c.length >= 4) found.add(c)
    }
  }

  // Fallback: standalone mixed alphanumeric 8-20 chars
  if (found.size === 0) {
    const sa = /\b([A-Z0-9]{8,20})\b/g
    let m: RegExpExecArray | null
    while ((m = sa.exec(upper)) !== null) {
      if (/[A-Z]/.test(m[1]) && /[0-9]/.test(m[1])) found.add(m[1])
    }
  }

  return Array.from(found).slice(0, 6)
}

export function SerialLookup() {
  const supabase = useMemo(() => createClient(), [])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LaptopResult | null | 'not-found'>(null)

  // Barcode scanner state
  const [scanActive, setScanActive] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'starting' | 'scanning'>('idle')

  // OCR state
  const [ocrActive, setOcrActive] = useState(false)
  const [ocrRetry, setOcrRetry] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'starting' | 'live' | 'processing' | 'done'>('idle')
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrCandidates, setOcrCandidates] = useState<string[]>([])
  const [showRawText, setShowRawText] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onScannedRef = useRef<(v: string) => void>(() => {})
  const inputRef = useRef<HTMLInputElement>(null)

  const doLookup = useCallback(async (serial: string) => {
    const q = serial.trim()
    if (!q) return
    setLoading(true)
    setResult(null)

    const { data } = await supabase
      .from('laptops')
      .select(`
        id, brand, model, processor, base_ram_gb, base_storage_gb, storage_type,
        display_size, condition, cost_price, sell_price, quantity, serial_number, notes,
        sale_items(
          quantity, sell_price_snapshot, cost_price_snapshot,
          sale:sales(
            id, sale_date, total_sell_price, total_cost_price, warranty_days, specs_promised,
            customer:customers(name, phone)
          )
        )
      `)
      .ilike('serial_number', q)
      .maybeSingle()

    setLoading(false)
    setResult(data ? (data as unknown as LaptopResult) : 'not-found')
  }, [supabase])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    doLookup(query)
  }

  // Barcode scanner lifecycle
  useEffect(() => {
    if (!scanActive) {
      setScanError(null)
      setScanStatus('idle')
      return
    }

    setScanStatus('starting')
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null
    let mounted = true

    ;(async () => {
      await new Promise(r => setTimeout(r, 300))
      if (!mounted) return

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (!mounted) return

        scanner = new Html5Qrcode(SCANNER_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.ITF,
          ],
          verbose: false,
        } as never)

        await (scanner as unknown as {
          start: (c: unknown, o: unknown, s: (t: string) => void, e: () => void) => Promise<void>
        }).start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 110 } },
          (text: string) => {
            setQuery(text)
            setScanActive(false)
            doLookup(text)
          },
          () => {}
        )

        if (mounted) setScanStatus('scanning')
        else scanner.stop().catch(() => {})
      } catch {
        if (mounted) {
          setScanError('Camera unavailable. Check camera permissions in your browser.')
          setScanStatus('idle')
        }
      }
    })()

    return () => {
      mounted = false
      if (scanner) scanner.stop().catch(() => {})
    }
  }, [scanActive, doLookup])

  onScannedRef.current = (v: string) => {
    setQuery(v)
    setScanActive(false)
    doLookup(v)
  }

  // OCR camera lifecycle
  useEffect(() => {
    if (!ocrActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      return
    }

    setOcrStatus('starting')
    setOcrError(null)
    let mounted = true

    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        if (mounted) setOcrStatus('live')
      } catch {
        if (mounted) {
          setOcrError('Camera unavailable. Check camera permissions in your browser.')
          setOcrStatus('idle')
          setOcrActive(false)
        }
      }
    })()

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [ocrActive, ocrRetry])

  async function handleCaptureAndRead() {
    const video = videoRef.current
    if (!video || ocrStatus !== 'live') return

    // Draw frame to canvas before stopping stream
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setOcrStatus('processing')
    setOcrError(null)

    try {
      const TesseractModule = await import('tesseract.js')
      const recognize = (TesseractModule as unknown as { recognize: (img: unknown, lang: string, opts?: unknown) => Promise<{ data: { text: string } }> }).recognize
      const { data } = await recognize(canvas, 'eng', { logger: () => {} })
      const text = data.text.trim()
      setOcrText(text)
      setOcrCandidates(parseSerialCandidates(text))
      setOcrStatus('done')
    } catch {
      setOcrError('Failed to read text from image. Try again with better lighting.')
      setOcrStatus('live')
      // Restart camera for retry
      setOcrRetry(n => n + 1)
    }
  }

  function useOcrCandidate(value: string) {
    setQuery(value)
    setOcrActive(false)
    setOcrStatus('idle')
    setOcrText('')
    setOcrCandidates([])
    setShowRawText(false)
    doLookup(value)
  }

  function handleScanAgain() {
    setOcrText('')
    setOcrCandidates([])
    setOcrStatus('idle')
    setOcrError(null)
    setShowRawText(false)
    setOcrRetry(n => n + 1)
  }

  function stopOcr() {
    setOcrActive(false)
    setOcrStatus('idle')
    setOcrText('')
    setOcrCandidates([])
    setOcrError(null)
    setShowRawText(false)
  }

  const mostRecentSale: SaleInfo | null = useMemo(() => {
    if (!result || result === 'not-found') return null
    const sales = result.sale_items
      .map(si => si.sale)
      .filter(Boolean) as SaleInfo[]
    if (!sales.length) return null
    return sales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0]
  }, [result])

  const isSold = result && result !== 'not-found' && result.quantity <= 0
  const ocrIsOpen = ocrActive || ocrStatus === 'processing' || ocrStatus === 'done'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#A1A1AA', pointerEvents: 'none' }} />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type serial number…"
            style={{ height: 48, paddingLeft: 36, fontSize: 14 }}
          />
        </div>
        {/* Barcode scan button */}
        <Button
          type="button"
          variant="outline"
          style={{ height: 48, paddingLeft: 14, paddingRight: 14, gap: 6, flexShrink: 0 }}
          onClick={() => {
            if (ocrIsOpen) stopOcr()
            setScanActive(p => !p)
          }}
        >
          <Camera style={{ width: 16, height: 16, color: scanActive ? '#F97316' : undefined }} />
          {scanActive ? 'Stop' : 'Scan'}
        </Button>
        {/* OCR button */}
        <Button
          type="button"
          variant="outline"
          style={{ height: 48, paddingLeft: 14, paddingRight: 14, gap: 6, flexShrink: 0 }}
          onClick={() => {
            if (scanActive) setScanActive(false)
            if (ocrIsOpen) {
              stopOcr()
            } else {
              setOcrActive(true)
              setOcrRetry(n => n + 1)
            }
          }}
        >
          <ScanText style={{ width: 16, height: 16, color: ocrIsOpen ? '#F97316' : undefined }} />
          {ocrIsOpen ? 'Stop' : 'OCR'}
        </Button>
        <Button type="submit" style={{ height: 48, paddingLeft: 18, paddingRight: 18 }} disabled={loading || !query.trim()}>
          {loading ? <Loader2 style={{ width: 15, height: 15 }} className="fc-spin" /> : 'Look up'}
        </Button>
      </form>

      {/* Barcode scanner viewfinder */}
      {scanActive && (
        <div style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', position: 'relative' }}>
          {scanStatus === 'starting' && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 2, minHeight: 250,
            }}>
              <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F97316', borderRadius: '50%' }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Starting camera…</p>
            </div>
          )}
          <div id={SCANNER_ID} style={{ width: '100%', minHeight: 250 }} />
          {scanStatus === 'scanning' && (
            <div style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Align barcode within the frame</p>
            </div>
          )}
        </div>
      )}

      {/* OCR camera viewfinder */}
      {ocrActive && (ocrStatus === 'starting' || ocrStatus === 'live') && (
        <div style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', position: 'relative' }}>
          {ocrStatus === 'starting' && (
            <div style={{
              minHeight: 260, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F97316', borderRadius: '50%' }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Starting camera…</p>
            </div>
          )}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              display: ocrStatus === 'live' ? 'block' : 'none',
              maxHeight: 340,
              objectFit: 'cover',
            }}
          />
          {ocrStatus === 'live' && (
            <div style={{
              padding: '10px 14px', backgroundColor: 'rgba(0,0,0,0.72)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                Point camera at the serial number sticker, then tap Capture
              </p>
              <Button
                type="button"
                onClick={handleCaptureAndRead}
                style={{
                  height: 40, paddingLeft: 16, paddingRight: 16, fontSize: 13,
                  backgroundColor: '#F97316', color: '#fff', border: 'none',
                  flexShrink: 0, gap: 6,
                }}
              >
                <ScanText style={{ width: 14, height: 14 }} />
                Capture &amp; Read
              </Button>
            </div>
          )}
        </div>
      )}

      {/* OCR processing spinner */}
      {ocrStatus === 'processing' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          padding: '32px 24px', borderRadius: 12, backgroundColor: '#FAFAF8', border: '1px solid #F0EEE8',
        }}>
          <Loader2 style={{ width: 30, height: 30, color: '#F97316' }} className="fc-spin" />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#3F3F46' }}>Reading sticker…</p>
            <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 3 }}>OCR engine is extracting text from the image</p>
          </div>
        </div>
      )}

      {/* OCR results */}
      {ocrStatus === 'done' && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14,
          borderRadius: 14, border: '1px solid #F0EEE8', padding: 18,
          backgroundColor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScanText style={{ width: 16, height: 16, color: '#F97316' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>Text found on sticker</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button type="button" variant="outline" onClick={handleScanAgain}
                style={{ height: 32, paddingLeft: 12, paddingRight: 12, fontSize: 12, gap: 5 }}>
                <RotateCcw style={{ width: 12, height: 12 }} />
                Scan again
              </Button>
              <Button type="button" variant="ghost" onClick={stopOcr}
                style={{ height: 32, paddingLeft: 8, paddingRight: 8, color: '#A1A1AA' }}>
                <X style={{ width: 14, height: 14 }} />
              </Button>
            </div>
          </div>

          {/* Candidates */}
          {ocrCandidates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Detected serial numbers — tap to use
              </p>
              {ocrCandidates.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => useOcrCandidate(c)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E4E2DC',
                    backgroundColor: '#FAFAF8', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600, color: '#0A0A0A', letterSpacing: '0.04em' }}>{c}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F97316', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    Use this <ArrowRight style={{ width: 12, height: 12 }} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '12px 14px', backgroundColor: '#FEF3C7', borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
                No serial number pattern detected. Try improving lighting, holding the camera steady, or type the serial number manually below.
              </p>
            </div>
          )}

          {/* Raw extracted text toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowRawText(p => !p)}
              style={{ fontSize: 12, color: '#A1A1AA', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
            >
              {showRawText ? '▲ Hide' : '▼ Show'} all extracted text
            </button>
            {showRawText && (
              <pre style={{
                marginTop: 8, padding: '10px 12px', backgroundColor: '#FAFAF8', borderRadius: 8,
                fontSize: 11, color: '#3F3F46', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                lineHeight: 1.6, border: '1px solid #F0EEE8', maxHeight: 180, overflowY: 'auto',
                fontFamily: 'monospace',
              }}>
                {ocrText || '(no text extracted)'}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {(scanError || ocrError) && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', backgroundColor: '#FEE2E2', borderRadius: 10 }}>
          <AlertCircle style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#B91C1C' }}>{scanError || ocrError}</p>
        </div>
      )}

      {/* Not found */}
      {result === 'not-found' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 24px', borderRadius: 16, border: '1px dashed #E4E2DC', textAlign: 'center' }}>
          <PackageX style={{ width: 40, height: 40, color: '#D4D2CB' }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#3F3F46' }}>Serial number not found in system</p>
            <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>
              No laptop with serial number <span style={{ fontFamily: 'monospace', fontWeight: 500, color: '#3F3F46' }}>{query}</span> exists in inventory.
            </p>
          </div>
        </div>
      )}

      {/* Laptop info card */}
      {result && result !== 'not-found' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Status + name */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.2 }}>
                  {result.brand} {result.model}
                </h2>
                {result.processor && (
                  <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 3 }}>{result.processor}</p>
                )}
                <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 4, fontFamily: 'monospace' }}>
                  SN: {result.serial_number}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  ...(isSold
                    ? { backgroundColor: '#FEE2E2', color: '#B91C1C' }
                    : { backgroundColor: '#D1FAE5', color: '#047857' })
                }}>
                  {isSold
                    ? <XCircle style={{ width: 13, height: 13 }} />
                    : <CheckCircle2 style={{ width: 13, height: 13 }} />
                  }
                  {isSold ? 'Sold' : 'In Stock'}
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                  textTransform: 'capitalize' as const,
                  backgroundColor: COND[result.condition]?.bg ?? '#F5F2EC',
                  color: COND[result.condition]?.text ?? '#3F3F46',
                }}>
                  {result.condition}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12, color: '#3F3F46', borderTop: '1px solid #F0EEE8', paddingTop: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MemoryStick style={{ width: 12, height: 12, color: '#A1A1AA' }} />
                {result.base_ram_gb} GB RAM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <HardDrive style={{ width: 12, height: 12, color: '#A1A1AA' }} />
                {storageLabel(result.base_storage_gb)} {result.storage_type}
              </span>
              {result.display_size && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Monitor style={{ width: 12, height: 12, color: '#A1A1AA' }} />
                  {result.display_size}&quot; display
                </span>
              )}
              {!isSold && (
                <span style={{ marginLeft: 'auto', fontWeight: 500, color: '#A1A1AA' }}>
                  Qty: {result.quantity}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 24, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0EEE8', fontSize: 13 }}>
              <div>
                <p style={{ fontSize: 10, color: '#A1A1AA', marginBottom: 2 }}>Cost Price</p>
                <p style={{ fontWeight: 600 }}>{pkr(result.cost_price)}</p>
              </div>
              {result.sell_price != null && (
                <div>
                  <p style={{ fontSize: 10, color: '#A1A1AA', marginBottom: 2 }}>Sell Price</p>
                  <p style={{ fontWeight: 600 }}>{pkr(result.sell_price)}</p>
                </div>
              )}
              {result.sell_price != null && (
                <div>
                  <p style={{ fontSize: 10, color: '#A1A1AA', marginBottom: 2 }}>Profit</p>
                  <p style={{ fontWeight: 600, color: result.sell_price - result.cost_price >= 0 ? '#047857' : '#DC2626' }}>
                    {pkr(result.sell_price - result.cost_price)}
                  </p>
                </div>
              )}
            </div>

            {result.notes && (
              <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0EEE8', lineHeight: 1.5 }}>
                {result.notes}
              </p>
            )}
          </div>

          {/* Sale info */}
          {mostRecentSale && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Sale Record
              </p>

              {mostRecentSale.customer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <User style={{ width: 13, height: 13, color: '#A1A1AA', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{mostRecentSale.customer.name}</span>
                  </div>
                  {mostRecentSale.customer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <Phone style={{ width: 13, height: 13, color: '#A1A1AA', flexShrink: 0 }} />
                      <span>{mostRecentSale.customer.phone}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 14 }}>
                <Calendar style={{ width: 13, height: 13, color: '#A1A1AA', flexShrink: 0 }} />
                <span>
                  {new Date(mostRecentSale.sale_date).toLocaleDateString('en-PK', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 20, fontSize: 13, paddingTop: 12, borderTop: '1px solid #F0EEE8', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 10, color: '#A1A1AA', marginBottom: 2 }}>Final Sell</p>
                  <p style={{ fontWeight: 600 }}>{pkr(mostRecentSale.total_sell_price)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#A1A1AA', marginBottom: 2 }}>Profit</p>
                  <p style={{ fontWeight: 600, color: (mostRecentSale.total_sell_price - mostRecentSale.total_cost_price) >= 0 ? '#047857' : '#DC2626' }}>
                    {pkr(mostRecentSale.total_sell_price - mostRecentSale.total_cost_price)}
                  </p>
                </div>
              </div>

              {mostRecentSale.warranty_days > 0 && (() => {
                const expiry = warrantyExpiryDate(mostRecentSale.sale_date, mostRecentSale.warranty_days)
                const isValid = expiry > new Date()
                const expiryStr = expiry.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, backgroundColor: isValid ? '#ECFDF5' : '#FEF2F2', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                      {isValid
                        ? <ShieldCheck style={{ width: 15, height: 15, color: '#059669' }} />
                        : <Shield style={{ width: 15, height: 15, color: '#EF4444' }} />
                      }
                      <div>
                        <p style={{ fontWeight: 500, color: isValid ? '#047857' : '#B91C1C' }}>
                          Warranty {mostRecentSale.warranty_days} days
                        </p>
                        <p style={{ fontSize: 11, color: isValid ? '#065F46' : '#991B1B', marginTop: 1 }}>
                          Expires {expiryStr}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      backgroundColor: isValid ? '#059669' : '#EF4444', color: '#fff',
                    }}>
                      {isValid ? 'Valid' : 'Expired'}
                    </span>
                  </div>
                )
              })()}

              {mostRecentSale.specs_promised && (
                <div style={{ padding: '10px 14px', backgroundColor: '#FAFAF8', borderRadius: 10, fontSize: 12, color: '#3F3F46', lineHeight: 1.6 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#A1A1AA', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Specs Promised
                  </p>
                  {mostRecentSale.specs_promised}
                </div>
              )}
            </div>
          )}

          {!mostRecentSale && result.quantity > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', backgroundColor: '#FAFAF8', borderRadius: 12, border: '1px solid #F0EEE8' }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: '#059669', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#3F3F46' }}>In stock — not yet sold.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

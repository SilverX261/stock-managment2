'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onScanned: (value: string) => void
}

const SCANNER_ID = 'fc-serial-scan-modal'

export function SerialScanModal({ open, onOpenChange, onScanned }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning'>('idle')
  const onScannedRef = useRef(onScanned)
  onScannedRef.current = onScanned
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  useEffect(() => {
    if (!open) {
      setError(null)
      setStatus('idle')
      return
    }

    setStatus('starting')
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null
    let mounted = true

    ;(async () => {
      // Wait for Dialog DOM to render
      await new Promise(r => setTimeout(r, 250))
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
          start: (
            config: unknown,
            options: unknown,
            onSuccess: (text: string) => void,
            onError: () => void,
          ) => Promise<void>
        }).start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 100 } },
          (text: string) => {
            onScannedRef.current(text)
            onOpenChangeRef.current(false)
          },
          () => {}
        )

        if (mounted) setStatus('scanning')
        else scanner.stop().catch(() => {})
      } catch {
        if (mounted) {
          setError('Camera unavailable. Check that you have allowed camera access in your browser, then try again.')
          setStatus('idle')
        }
      }
    })()

    return () => {
      mounted = false
      if (scanner) {
        scanner.stop().catch(() => {})
      }
    }
  }, [open])

  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent style={{ maxWidth: 380, padding: 0, overflow: 'hidden', borderRadius: 16 }}>
        <div style={{ padding: '20px 20px 16px' }}>
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              <Camera style={{ width: 18, height: 18, color: '#F97316' }} />
              Scan Serial Number
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 6 }}>
            Point the camera at the barcode or serial number sticker on the laptop.
          </p>
        </div>

        {/* Viewfinder */}
        <div style={{ position: 'relative', margin: '0 20px', borderRadius: 10, overflow: 'hidden', backgroundColor: '#0A0A0A', minHeight: 220 }}>
          {status === 'starting' && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 2,
            }}>
              <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#F97316', borderRadius: '50%' }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Starting camera…</p>
            </div>
          )}
          <div id={SCANNER_ID} style={{ width: '100%' }} />
        </div>

        {status === 'scanning' && (
          <p style={{ fontSize: 11, color: '#A1A1AA', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
            Align barcode within the frame
          </p>
        )}

        {error && (
          <div style={{ margin: '12px 20px 0', display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEE2E2', borderRadius: 8 }}>
            <AlertCircle style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        <div style={{ padding: 20 }}>
          <Button variant="outline" onClick={handleClose} style={{ width: '100%', height: 44 }}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { SerialLookup } from '@/components/scan/serial-lookup'

export default function ScanPage() {
  return (
    <main style={{ padding: '24px 16px', maxWidth: 620, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.2 }}>
          Serial Lookup
        </h1>
        <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>
          Scan or type a laptop serial number to view full details, warranty status, and sale history.
        </p>
      </div>
      <SerialLookup />
    </main>
  )
}

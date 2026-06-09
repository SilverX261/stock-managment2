import { SerialLookup } from '@/components/scan/serial-lookup'

export const dynamic = 'force-dynamic'

export default function ScanPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Serial Lookup</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>
          Scan or type a laptop serial number to view full details, warranty status, and sale history.
        </p>
      </div>
      <div className="fc-page-content">
        <SerialLookup />
      </div>
    </div>
  )
}

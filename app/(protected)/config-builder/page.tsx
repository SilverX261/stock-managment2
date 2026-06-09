import { ConfigBuilder } from '@/components/config-builder/config-builder'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Config Builder — Fine Computers' }

export default function ConfigBuilderPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Config Builder</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Build a custom laptop configuration for a customer</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ConfigBuilder />
      </div>
    </div>
  )
}

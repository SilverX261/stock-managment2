import { ConfigBuilder } from '@/components/config-builder/config-builder'

export const metadata = { title: 'Config Builder — Fine Computers' }

export default function ConfigBuilderPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Config Builder</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Build a custom laptop configuration for a customer</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ConfigBuilder />
      </div>
    </div>
  )
}

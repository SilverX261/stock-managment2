import { DashboardView } from '@/components/dashboard/dashboard-view'

export const metadata = { title: 'Dashboard — Fine Computers' }

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
        <DashboardView />
      </div>
    </div>
  )
}

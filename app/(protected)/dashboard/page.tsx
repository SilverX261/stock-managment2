import { DashboardView } from '@/components/dashboard/dashboard-view'

export const metadata = { title: 'Dashboard — Fine Computers' }

export default function DashboardPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="fc-page-content">
        <DashboardView />
      </div>
    </div>
  )
}

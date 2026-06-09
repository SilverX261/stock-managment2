import { AnalyticsView } from '@/components/analytics/analytics-view'

export const metadata = { title: 'Analytics — Fine Computers' }

export default function AnalyticsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Analytics</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Revenue, profit and performance breakdown</p>
      </div>
      <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
        <AnalyticsView />
      </div>
    </div>
  )
}

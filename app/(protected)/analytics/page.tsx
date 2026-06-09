import { AnalyticsView } from '@/components/analytics/analytics-view'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics — Fine Computers' }

export default function AnalyticsPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Analytics</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Revenue, profit and performance breakdown</p>
      </div>
      <div className="fc-page-content">
        <AnalyticsView />
      </div>
    </div>
  )
}

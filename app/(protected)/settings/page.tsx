import { SettingsView } from '@/components/settings/settings-view'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings — Fine Computers' }

export default function SettingsPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Shop configuration and data management</p>
      </div>
      <div className="fc-page-content">
        <SettingsView />
      </div>
    </div>
  )
}

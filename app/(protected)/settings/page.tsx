import { SettingsView } from '@/components/settings/settings-view'

export const metadata = { title: 'Settings — Fine Computers' }

export default function SettingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Shop configuration and data management</p>
      </div>
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        <SettingsView />
      </div>
    </div>
  )
}

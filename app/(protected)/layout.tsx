import { AppNav } from '@/components/nav/app-nav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF8' }}>
      {/* AppNav renders sidebar (desktop) + topbar + bottomnav (mobile) */}
      <AppNav />

      {/* Main content — sidebar pushes it right on desktop */}
      <main
        className="fc-main"
        style={{
          flex:            1,
          minWidth:        0,
          minHeight:       '100vh',
          backgroundColor: '#FAFAF8',
          display:         'flex',
          flexDirection:   'column',
          marginLeft:      240, /* sidebar width — fc-main resets this on mobile */
        }}
      >
        {children}
      </main>
    </div>
  )
}

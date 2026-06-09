'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, Settings2, ShoppingCart,
  Users, BarChart3, Settings, WifiOff, Tags, QrCode,
  MoreHorizontal,
} from 'lucide-react'

/* ── Nav items ─────────────────────────────────────────────────── */
const NAV = [
  { href: '/dashboard',      label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/inventory',      label: 'Inventory',  Icon: Package },
  { href: '/config-builder', label: 'Config',     Icon: Settings2 },
  { href: '/sales',          label: 'Sales',      Icon: ShoppingCart },
  { href: '/customers',      label: 'Customers',  Icon: Users },
  { href: '/scan',           label: 'Scan',       Icon: QrCode },
  { href: '/analytics',      label: 'Analytics',  Icon: BarChart3 },
  { href: '/price-list',     label: 'Price List', Icon: Tags },
  { href: '/settings',       label: 'Settings',   Icon: Settings },
]
const BOTTOM = ['/dashboard', '/inventory', '/config-builder', '/sales', '/customers']
const MORE   = ['/analytics', '/price-list', '/scan', '/settings']

/* ── Colours (used repeatedly) ─────────────────────────────────── */
const BG     = '#0A0A0A'
const ORANGE = '#F97316'
const MUTED  = '#A1A1AA'
const DIM    = 'rgba(255,255,255,0.06)'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppNav() {
  const pathname              = usePathname()
  const router                = useRouter()
  const [online,     setOnline]     = useState(true)
  const [mounted,    setMounted]    = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOnline(navigator.onLine)
    const up   = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  return (
    <>
      {/* ── Offline banner ──────────────────────────────────── */}
      {mounted && !online && (
        <div style={{
          position:       'fixed', top: 0, left: 0, right: 0, zIndex: 60,
          display:        'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          backgroundColor:'#F59E0B', color: '#fff',
          fontSize: 12, fontWeight: 600, padding: '6px 0',
        }}>
          <WifiOff style={{ width: 13, height: 13 }} />
          Offline — changes will sync when reconnected
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR  (fc-sidebar = flex on ≥768, none on <768)
          ═══════════════════════════════════════════════════════ */}
      <aside
        className="fc-sidebar"
        style={{
          position:       'fixed',
          top:            0,
          left:           0,
          width:          240,
          height:         '100vh',
          backgroundColor: BG,
          flexDirection:  'column',
          overflow:       'hidden',
          zIndex:         20,
          flexShrink:     0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            backgroundColor: ORANGE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>
            FC
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px' }}>
            Fine Computers
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: DIM, margin: '0 20px 14px', flexShrink: 0 }} />

        {/* Nav links — only this section scrolls */}
        <nav style={{ flex: 1, minHeight: 0, padding: '0 10px', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href)
            return (
              <NavItem key={href} href={href} label={label} Icon={Icon} active={active} />
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${DIM}`, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: 'rgba(161,161,170,0.35)' }}>Fine Computers Portal v1.0</p>
          <p style={{ fontSize: 10, color: 'rgba(161,161,170,0.2)', marginTop: 2 }}>Trust Plaza, Sargodha</p>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MOBILE TOP BAR  (fc-topbar = none on ≥768, flex on <768)
          ═══════════════════════════════════════════════════════ */}
      <header
        className="fc-topbar"
        style={{
          position:       'fixed', top: 0, left: 0, right: 0, zIndex: 30,
          alignItems:     'center', justifyContent: 'space-between',
          padding:        '0 16px', height: 56,
          backgroundColor: '#FFFFFF',
          borderBottom:   '1px solid #F0EEE8',
          boxShadow:      '0 1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            backgroundColor: ORANGE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 9, fontWeight: 800,
          }}>
            FC
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>Fine Computers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={() => router.push('/scan')}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: isActive(pathname, '/scan') ? '#FFF7ED' : 'transparent',
              color: isActive(pathname, '/scan') ? ORANGE : MUTED,
              transition: 'background-color 150ms',
            }}
            aria-label="Serial Scan"
          >
            <QrCode style={{ width: 17, height: 17 }} />
          </button>
        </div>
      </header>

      {/* No spacer needed — fc-main has padding-top: 56px on mobile via CSS */}

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAV  (fc-bottomnav)
          ═══════════════════════════════════════════════════════ */}
      <nav
        className="fc-bottomnav"
        style={{
          position:       'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
          backgroundColor: '#FFFFFF',
          borderTop:       '1px solid #F0EEE8',
          boxShadow:       '0 -2px 12px rgba(0,0,0,0.05)',
          height:          64,
          paddingBottom:   'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {NAV.filter(n => BOTTOM.includes(n.href)).map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            3,
                color:          active ? ORANGE : MUTED,
                fontSize:       10,
                fontWeight:     600,
                textDecoration: 'none',
                padding:        '6px 0',
                transition:     'color 150ms',
              }}
            >
              <Icon style={{ width: 20, height: 20 }} />
              {label}
            </Link>
          )
        })}

        {/* More button — 6th tab */}
        {(() => {
          const moreActive = MORE.some(href => isActive(pathname, href))
          return (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            3,
                color:          moreActive ? ORANGE : MUTED,
                fontSize:       10,
                fontWeight:     600,
                padding:        '6px 0',
                background:     'none',
                border:         'none',
                cursor:         'pointer',
                transition:     'color 150ms',
              }}
              aria-label="More pages"
            >
              <MoreHorizontal style={{ width: 20, height: 20 }} />
              More
            </button>
          )
        })()}
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MORE DRAWER
          ═══════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position:        'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
          />

          {/* Drawer sheet */}
          <div
            style={{
              position:        'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              backgroundColor: '#FFFFFF',
              borderRadius:    '20px 20px 0 0',
              boxShadow:       '0 -8px 32px rgba(0,0,0,0.14)',
              paddingBottom:   'env(safe-area-inset-bottom, 12px)',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: '#E4E4E7' }} />
            </div>

            {/* Label */}
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: '#A1A1AA', textTransform: 'uppercase',
              padding: '8px 20px 6px',
            }}>
              More
            </p>

            {/* Rows */}
            {NAV.filter(n => MORE.includes(n.href)).map(({ href, label, Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            14,
                    padding:        '14px 20px',
                    textDecoration: 'none',
                    color:          active ? ORANGE : '#18181B',
                    borderTop:      '1px solid #F4F4F5',
                    backgroundColor: active ? '#FFF7ED' : 'transparent',
                    transition:     'background-color 120ms',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    backgroundColor: active ? '#FFEDD5' : '#F4F4F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon style={{ width: 18, height: 18, color: active ? ORANGE : '#71717A' }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
                  {/* Chevron */}
                  <svg style={{ marginLeft: 'auto', color: '#D4D4D8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              )
            })}

            <div style={{ height: 12 }} />
          </div>
        </>
      )}

    </>
  )
}

/* ── Desktop nav item ───────────────────────────────────────────── */
function NavItem({ href, label, Icon, active }: {
  href: string; label: string; Icon: React.ComponentType<{ style?: React.CSSProperties }>; active: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const bg = active
    ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
    : hovered ? 'rgba(255,255,255,0.06)' : 'transparent'

  const color = active ? '#FFFFFF' : hovered ? '#FFFFFF' : '#A1A1AA'

  return (
    <Link
      href={href}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        '9px 12px',
        borderRadius:   9,
        fontSize:       13,
        fontWeight:     500,
        color,
        background:     bg,
        boxShadow:      active ? '0 4px 14px rgba(249,115,22,0.28)' : 'none',
        transition:     'background 150ms, color 150ms, box-shadow 150ms',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
      {label}
    </Link>
  )
}

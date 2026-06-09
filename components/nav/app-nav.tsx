'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, Settings2, ShoppingCart,
  Users, BarChart3, Settings, WifiOff, Tags, Search, QrCode,
} from 'lucide-react'
import { GlobalSearch } from '@/components/search/global-search'

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
const BOTTOM = ['/dashboard', '/inventory', '/config-builder', '/sales', '/scan']

/* ── Colours (used repeatedly) ─────────────────────────────────── */
const BG     = '#0A0A0A'
const ORANGE = '#F97316'
const MUTED  = '#A1A1AA'
const DIM    = 'rgba(255,255,255,0.06)'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppNav() {
  const pathname            = usePathname()
  const router              = useRouter()
  const [online,  setOnline]  = useState(true)
  const [search,  setSearch]  = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOnline(navigator.onLine)
    const up   = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearch(true) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
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

        {/* Search button */}
        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
          <button
            onClick={() => setSearch(true)}
            style={{
              display:         'flex', alignItems: 'center', gap: 8,
              width:           '100%', padding: '7px 10px',
              borderRadius:    8, cursor: 'pointer',
              backgroundColor: DIM, color: MUTED,
              fontSize: 12, border: 'none',
              transition:      'background-color 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.09)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = DIM }}
          >
            <Search style={{ width: 13, height: 13, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
            <kbd style={{
              fontSize: 10, borderRadius: 4, padding: '1px 5px',
              backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.6)',
              fontFamily: 'inherit', border: 'none',
            }}>⌃K</kbd>
          </button>
        </div>

        {/* Section label */}
        <p style={{ padding: '0 20px 6px', fontSize: 10, fontWeight: 600, color: 'rgba(161,161,170,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
          Navigation
        </p>

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
          <button
            onClick={() => setSearch(true)}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'transparent', color: MUTED,
              transition: 'background-color 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAF8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            aria-label="Search"
          >
            <Search style={{ width: 17, height: 17 }} />
          </button>
        </div>
      </header>

      {/* Mobile top-bar spacer so content doesn't hide under it */}
      <div className="fc-topbar" style={{ height: 56, flexShrink: 0, width: '100%' }} />

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
      </nav>

      <GlobalSearch open={search} onClose={() => setSearch(false)} />
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

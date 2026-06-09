'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FAFAF8' }}>

      {/* Left panel — desktop only */}
      <div style={{
        display: 'none', // shown on lg via JS below — or just use media query in inline via @media
        width: '44%', backgroundColor: '#0A0A0A',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px',
      }} className="fc-desktop-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>FC</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Fine Computers</span>
        </div>
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, backgroundColor: 'rgba(249,115,22,0.15)', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F97316', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#F97316' }}>Trust Plaza, Sargodha</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
              Stock &amp; sales<br /><span style={{ color: '#F97316' }}>made simple.</span>
            </h1>
            <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.6, maxWidth: 300 }}>
              Inventory management, config builder, customer database, and real-time analytics — all in one place.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Laptop inventory with specs', 'Config builder & price calculator', 'Customer profiles & sales history', 'Daily reports & analytics'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F97316' }} />
                </div>
                <span style={{ color: '#A1A1AA', fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(161,161,170,0.3)', fontSize: 11 }}>Fine Computers Portal v1.0</p>
      </div>

      {/* Right panel — login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>FC</div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>Fine Computers</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A' }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>Sign in to your portal to continue</p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #F0EEE8', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 28 }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3F3F46', marginBottom: 6 }}>Email</label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={{ height: 44 }} />
              </div>
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3F3F46', marginBottom: 6 }}>Password</label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" style={{ height: 44 }} />
              </div>
              {error && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#B91C1C', fontSize: 13 }}>{error}</div>
              )}
              <Button type="submit" style={{ height: 44, fontSize: 14, marginTop: 4 }} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="fc-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#A1A1AA', marginTop: 24 }}>
            Fine Computers · Trust Plaza, Sargodha
          </p>
        </div>
      </div>
    </div>
  )
}

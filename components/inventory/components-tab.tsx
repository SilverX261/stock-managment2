'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { ComponentForm } from './component-form'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Cpu, AlertTriangle } from 'lucide-react'
import type { Component, ComponentInsert } from '@/types/database'

const fmt = (n: number) => n.toLocaleString('en-PK')
const CARD: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 12, padding: '12px 14px' }
const CAT: Record<string, { bg: string; text: string }> = {
  RAM:      { bg: '#CCFBF1', text: '#0F766E' }, SSD:     { bg: '#D1FAE5', text: '#047857' },
  HDD:      { bg: '#F5F2EC', text: '#3F3F46' }, Charger: { bg: '#FEF3C7', text: '#B45309' },
  Battery:  { bg: '#FEF3C7', text: '#B45309' }, Screen:  { bg: '#CCFBF1', text: '#0F766E' },
  Keyboard: { bg: '#F5F2EC', text: '#3F3F46' }, Fan:     { bg: '#F5F2EC', text: '#3F3F46' },
  Other:    { bg: '#F5F2EC', text: '#3F3F46' },
}

export function ComponentsTab() {
  const supabase = useMemo(() => createClient(), [])
  const [components,   setComponents]   = useState<Component[]>([])
  const [loading,      setLoading]      = useState(true)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editing,      setEditing]      = useState<Component | null>(null)
  const [deleting,     setDeleting]     = useState<Component | null>(null)
  const [deleteLoading,setDeleteLoading]= useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const fetchComponents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('components').select('*').order('category').order('name')
    if (error) setError(error.message)
    else setComponents(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchComponents() }, [fetchComponents])
  useEffect(() => {
    const ch = supabase.channel('components-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'components' }, () => fetchComponents())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, fetchComponents])

  async function handleSave(data: Omit<ComponentInsert, 'id' | 'created_at' | 'updated_at' | 'supplier_id'>, id?: string) {
    if (id) { const { error } = await supabase.from('components').update(data).eq('id', id); if (error) throw error }
    else    { const { error } = await supabase.from('components').insert(data);               if (error) throw error }
    await fetchComponents()
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    const { error } = await supabase.from('components').delete().eq('id', deleting.id)
    if (error) setError(error.message)
    else await fetchComponents()
    setDeleteLoading(false); setDeleting(null)
  }

  const grouped = components.reduce<Record<string, Component[]>>((acc, c) => {
    ;(acc[c.category] ??= []).push(c); return acc
  }, {})

  return (
    <div style={{ position: 'relative' }}>
      <div className="fc-toolbar" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#A1A1AA' }}>{loading ? 'Loading…' : `${components.length} component${components.length !== 1 ? 's' : ''}`}</p>
        <div className="fc-toolbar-btns">
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus style={{ width: 14, height: 14 }} /> Add Component
          </Button>
        </div>
      </div>

      {error && <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="fc-pulse" style={{ height: 80, borderRadius: 12, backgroundColor: '#F5F2EC' }} />)}
        </div>
      ) : components.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Cpu style={{ width: 24, height: 24, color: '#A1A1AA' }} />
          </div>
          <p style={{ fontWeight: 600, color: '#0A0A0A' }}>No components yet</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>Add RAM, SSDs, chargers and more</p>
          <Button onClick={() => { setEditing(null); setFormOpen(true) }} style={{ marginTop: 16 }}>
            <Plus style={{ width: 14, height: 14 }} /> Add Component
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([category, items]) => {
            const cs = CAT[category] ?? { bg: '#F5F2EC', text: '#3F3F46' }
            return (
              <div key={category}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ ...cs, display: 'inline-flex', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{category}</span>
                  <span style={{ fontSize: 11, color: '#A1A1AA' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(comp => {
                    const profit   = comp.sell_price - comp.cost_price
                    const margin   = comp.sell_price > 0 ? ((profit / comp.sell_price) * 100).toFixed(1) : '0'
                    const lowStock = comp.quantity <= 2
                    return (
                      <div key={comp.id} style={CARD}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{comp.name}</span>
                              {comp.specification && <span style={{ fontSize: 11, color: '#A1A1AA' }}>{comp.specification}</span>}
                              {lowStock && <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}><AlertTriangle style={{ width: 9, height: 9 }} />Low</span>}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', marginTop: 6, fontSize: 11 }}>
                              <span style={{ color: '#A1A1AA' }}>Cost: <span style={{ color: '#3F3F46', fontWeight: 500 }}>PKR {fmt(comp.cost_price)}</span></span>
                              <span style={{ color: '#A1A1AA' }}>Sell: <span style={{ color: '#3F3F46', fontWeight: 600 }}>PKR {fmt(comp.sell_price)}</span></span>
                              <span style={{ fontWeight: 600, color: profit >= 0 ? '#059669' : '#EF4444' }}>+PKR {fmt(profit)} ({margin}%)</span>
                              <span style={{ marginLeft: 'auto', color: '#A1A1AA' }}>Qty: <span style={{ color: '#3F3F46', fontWeight: 500 }}>{comp.quantity}</span></span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                            <SmBtn onClick={() => { setEditing(comp); setFormOpen(true) }} icon={<Pencil style={{ width: 12, height: 12 }} />} />
                            <SmBtn onClick={() => setDeleting(comp)} icon={<Trash2 style={{ width: 12, height: 12 }} />} danger />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ComponentForm open={formOpen} onOpenChange={setFormOpen} initial={editing} onSave={handleSave} />

      <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete component?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{deleting?.name}</strong>. Cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} style={{ backgroundColor: '#EF4444', color: '#fff' }}>
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SmBtn({ onClick, icon, danger }: { onClick: () => void; icon: React.ReactNode; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: hov ? (danger ? '#FEE2E2' : '#F5F2EC') : 'transparent', color: hov ? (danger ? '#EF4444' : '#3F3F46') : '#A1A1AA', transition: 'background-color 100ms' }}>
      {icon}
    </button>
  )
}

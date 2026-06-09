'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { LaptopForm } from './laptop-form'
import { BulkImportModal } from './bulk-import-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, HardDrive, Monitor, MemoryStick, AlertTriangle, FileSpreadsheet, Search } from 'lucide-react'
import { withSpecs, makeLaptopFuse } from '@/lib/fuzzy'
import type { Laptop, LaptopInsert } from '@/types/database'

const fmt = (n: number) => n.toLocaleString('en-PK')
const CARD: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 16 }
function storageLabel(gb: number) { return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB` }
const COND: Record<string, { bg: string; text: string }> = {
  new:         { bg: '#D1FAE5', text: '#047857' },
  used:        { bg: '#FEF3C7', text: '#B45309' },
  refurbished: { bg: '#CCFBF1', text: '#0F766E' },
}

export function LaptopsTab() {
  const supabase = useMemo(() => createClient(), [])
  const [laptops,       setLaptops]       = useState<Laptop[]>([])
  const [loading,       setLoading]       = useState(true)
  const [formOpen,      setFormOpen]      = useState(false)
  const [importOpen,    setImportOpen]    = useState(false)
  const [editing,       setEditing]       = useState<Laptop | null>(null)
  const [deleting,      setDeleting]      = useState<Laptop | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [search,        setSearch]        = useState('')

  const searchItems = useMemo(() => laptops.map(withSpecs), [laptops])
  const fuse        = useMemo(() => makeLaptopFuse(searchItems), [searchItems])
  const displayed   = useMemo(() => {
    if (!search.trim()) return laptops
    return fuse.search(search).map(r => r.item)
  }, [fuse, laptops, search])

  const fetchLaptops = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('laptops').select('*').order('brand').order('model')
    if (error) setError(error.message)
    else setLaptops(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLaptops() }, [fetchLaptops])
  useEffect(() => {
    const ch = supabase.channel('laptops-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'laptops' }, () => fetchLaptops())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, fetchLaptops])

  async function handleSave(data: Omit<LaptopInsert, 'id' | 'created_at' | 'updated_at' | 'supplier_id'>, id?: string) {
    if (id) {
      const { error } = await supabase.from('laptops').update(data).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('laptops').insert(data)
      if (error) throw error
    }
    await fetchLaptops()
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    const { error } = await supabase.from('laptops').delete().eq('id', deleting.id)
    if (error) setError(error.message)
    else await fetchLaptops()
    setDeleteLoading(false); setDeleting(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Header row */}
      <div className="fc-toolbar" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#A1A1AA' }}>
          {loading ? 'Loading…' : search.trim()
            ? `${displayed.length} of ${laptops.length} laptop${laptops.length !== 1 ? 's' : ''}`
            : `${laptops.length} laptop${laptops.length !== 1 ? 's' : ''}`}
        </p>
        <div className="fc-toolbar-btns">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet style={{ width: 14, height: 14 }} />
            Import Excel
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus style={{ width: 14, height: 14 }} /> Add Laptop
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {!loading && laptops.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#A1A1AA' }} />
          <Input
            placeholder="Search brand, model, processor, RAM, storage…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, height: 40 }}
          />
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: 13 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="fc-pulse" style={{ height: 112, borderRadius: 16, backgroundColor: '#F5F2EC' }} />)}
        </div>
      ) : laptops.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Monitor style={{ width: 24, height: 24, color: '#A1A1AA' }} />
          </div>
          <p style={{ fontWeight: 600, color: '#0A0A0A' }}>No laptops yet</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>Add your first laptop to get started</p>
          <Button onClick={() => { setEditing(null); setFormOpen(true) }} style={{ marginTop: 16 }}>
            <Plus style={{ width: 14, height: 14 }} /> Add Laptop
          </Button>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}>
          <Monitor style={{ width: 40, height: 40, color: '#E4E2DC', marginBottom: 8 }} />
          <p style={{ fontWeight: 600, color: '#0A0A0A' }}>No results found</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>Try a different search term</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(laptop => {
            const hasSell  = laptop.sell_price !== null
            const profit   = hasSell ? (laptop.sell_price as number) - laptop.cost_price : null
            const margin   = hasSell && laptop.sell_price! > 0 ? ((profit! / laptop.sell_price!) * 100).toFixed(1) : null
            const lowStock = laptop.quantity <= 1
            const cond     = COND[laptop.condition] ?? { bg: '#F5F2EC', text: '#3F3F46' }

            return (
              <div key={laptop.id} style={{ ...CARD, transition: 'box-shadow 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>{laptop.brand} {laptop.model}</h3>
                      <span style={{ ...cond, display: 'inline-flex', padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }}>{laptop.condition}</span>
                      {lowStock && <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}><AlertTriangle style={{ width: 10, height: 10 }} />Low stock</span>}
                    </div>
                    {laptop.processor && <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>{laptop.processor}</p>}
                    {laptop.serial_number
                      ? <p style={{ fontSize: 10, color: '#A1A1AA', marginTop: 2, fontFamily: 'monospace' }}>SN: {laptop.serial_number}</p>
                      : <span style={{ display: 'inline-block', marginTop: 2, fontSize: 9, fontWeight: 600, backgroundColor: '#F5F2EC', color: '#D4D2CB', padding: '1px 6px', borderRadius: 99 }}>No serial</span>
                    }
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <ActionBtn onClick={() => { setEditing(laptop); setFormOpen(true) }} icon={<Pencil style={{ width: 13, height: 13 }} />} />
                    <ActionBtn onClick={() => setDeleting(laptop)} icon={<Trash2 style={{ width: 13, height: 13 }} />} danger />
                  </div>
                </div>

                {/* Specs row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', fontSize: 11, color: '#A1A1AA', marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MemoryStick style={{ width: 11, height: 11 }} />{laptop.base_ram_gb} GB RAM</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><HardDrive style={{ width: 11, height: 11 }} />{storageLabel(laptop.base_storage_gb)} {laptop.storage_type}</span>
                  {laptop.display_size && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Monitor style={{ width: 11, height: 11 }} />{laptop.display_size}&quot;</span>}
                  <span style={{ marginLeft: 'auto', fontWeight: 500, color: '#3F3F46' }}>Qty: {laptop.quantity}</span>
                </div>

                {/* Price row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F0EEE8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#A1A1AA', display: 'block' }}>Cost</span>
                      <span style={{ fontWeight: 500 }}>PKR {fmt(laptop.cost_price)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#A1A1AA', display: 'block' }}>Sell</span>
                      {hasSell ? <span style={{ fontWeight: 600 }}>PKR {fmt(laptop.sell_price as number)}</span>
                        : <span style={{ color: '#A1A1AA', fontStyle: 'italic' }}>Price TBD</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#A1A1AA', display: 'block' }}>Profit</span>
                    {profit !== null
                      ? <span style={{ fontSize: 13, fontWeight: 600, color: profit >= 0 ? '#059669' : '#EF4444' }}>PKR {fmt(profit)} <span style={{ fontSize: 11, fontWeight: 400 }}>({margin}%)</span></span>
                      : <span style={{ fontSize: 13, color: '#A1A1AA', fontStyle: 'italic' }}>—</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditing(null); setFormOpen(true) }}
        style={{
          display: 'none', /* shown via fc-bottomnav logic — we use the Button in header instead */
          position: 'fixed', bottom: 80, right: 16, zIndex: 30,
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: '#F97316', color: '#fff',
          boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
          border: 'none', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Add laptop"
      >
        <Plus style={{ width: 24, height: 24 }} />
      </button>

      <LaptopForm open={formOpen} onOpenChange={setFormOpen} initial={editing} onSave={handleSave} />
      <BulkImportModal open={importOpen} onOpenChange={setImportOpen} onImported={fetchLaptops} />

      <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete laptop?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{deleting?.brand} {deleting?.model}</strong>. Cannot be undone.</AlertDialogDescription>
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

function ActionBtn({ onClick, icon, danger }: { onClick: () => void; icon: React.ReactNode; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: hov ? (danger ? '#FEE2E2' : '#F5F2EC') : 'transparent',
        color: hov ? (danger ? '#EF4444' : '#3F3F46') : '#A1A1AA',
        transition: 'background-color 100ms, color 100ms',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {icon}
    </button>
  )
}

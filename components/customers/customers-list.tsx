'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, User, Phone, ChevronRight, Users } from 'lucide-react'
import { makeFuse } from '@/lib/fuzzy'
import type { Customer } from '@/types/database'

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`
type CustomerWithStats = Customer & { sale_count: number; total_spend: number; open_returns: number }

export function CustomersList() {
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [addOpen,   setAddOpen]   = useState(false)
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [address,   setAddress]   = useState('')
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('customers')
      .select('*, sales(id, total_sell_price), customer_returns(id, status)').order('name')
    if (data) {
      setCustomers(data.map((c: Customer & { sales?: { id: string; total_sell_price: number }[]; customer_returns?: { id: string; status: string }[] }) => ({
        ...c,
        sale_count:   c.sales?.length ?? 0,
        total_spend:  c.sales?.reduce((s: number, sale: { total_sell_price: number }) => s + sale.total_sell_price, 0) ?? 0,
        open_returns: c.customer_returns?.filter(r => r.status !== 'resolved').length ?? 0,
      })))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  function resetForm() { setName(''); setPhone(''); setAddress(''); setNotes(''); setFormError(null) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setFormError('Name is required.'); return }
    setSaving(true); setFormError(null)
    const { error } = await supabase.from('customers').insert({
      name: name.trim(), phone: phone.trim() || null, address: address.trim() || null, notes: notes.trim() || null,
    })
    if (error) setFormError(error.message)
    else { await fetchCustomers(); setAddOpen(false); resetForm() }
    setSaving(false)
  }

  const custFuse = useMemo(
    () => makeFuse(customers, [{ name: 'name', weight: 2 }, { name: 'phone', weight: 1 }, { name: 'address', weight: 0.5 }]),
    [customers]
  )
  const filtered = useMemo(() => {
    if (!query.trim()) return customers
    return custFuse.search(query).map(r => r.item)
  }, [custFuse, customers, query])

  return (
    <div>
      <div className="fc-list-toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#A1A1AA' }} />
          <Input placeholder="Search by name or phone…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 36, height: 44 }} />
        </div>
        <Button style={{ height: 44, flexShrink: 0 }} onClick={() => setAddOpen(true)}>
          <Plus style={{ width: 15, height: 15 }} /> Add Customer
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="fc-pulse" style={{ height: 80, borderRadius: 14, backgroundColor: '#F5F2EC' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Users style={{ width: 24, height: 24, color: '#A1A1AA' }} />
          </div>
          <p style={{ fontWeight: 600, color: '#0A0A0A' }}>{query ? 'No matching customers' : 'No customers yet'}</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>
            {query ? 'No results found — try a different search term' : 'Customers are added when you create a sale'}
          </p>
          {!query && (
            <Button style={{ marginTop: 16 }} onClick={() => setAddOpen(true)}>
              <Plus style={{ width: 15, height: 15 }} /> Add Customer
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => router.push(`/customers/${c.id}`)}
              style={{ width: '100%', textAlign: 'left', padding: 16, backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'box-shadow 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User style={{ width: 18, height: 18, color: '#A1A1AA' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{c.name}</span>
                    {c.sale_count > 0 && <span style={{ backgroundColor: '#F5F2EC', color: '#3F3F46', padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{c.sale_count} sale{c.sale_count !== 1 ? 's' : ''}</span>}
                    {c.open_returns > 0 && <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{c.open_returns} open issue{c.open_returns !== 1 ? 's' : ''}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3, fontSize: 11, color: '#A1A1AA' }}>
                    {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone style={{ width: 11, height: 11 }} />{c.phone}</span>}
                    {c.total_spend > 0 && <span style={{ fontWeight: 500, color: '#3F3F46' }}>{pkr(c.total_spend)} total</span>}
                  </div>
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: '#A1A1AA', flexShrink: 0 }} />
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) resetForm() }}>
        <DialogContent style={{ maxWidth: '380px' }}>
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div><Label htmlFor="cust-name" style={{ display: 'block', marginBottom: 6 }}>Name *</Label><Input id="cust-name" style={{ height: 44 }} placeholder="Muhammad Ahmed" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label htmlFor="cust-phone" style={{ display: 'block', marginBottom: 6 }}>Phone</Label><Input id="cust-phone" style={{ height: 44 }} placeholder="0300-1234567" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label htmlFor="cust-addr" style={{ display: 'block', marginBottom: 6 }}>Address</Label><Input id="cust-addr" style={{ height: 44 }} placeholder="Sargodha" value={address} onChange={e => setAddress(e.target.value)} /></div>
            <div><Label htmlFor="cust-notes" style={{ display: 'block', marginBottom: 6 }}>Notes</Label><Textarea id="cust-notes" rows={2} placeholder="Any notes…" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            {formError && <p style={{ fontSize: 13, color: '#EF4444', backgroundColor: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>{formError}</p>}
            <DialogFooter style={{ flexDirection: 'row', gap: 8 }}>
              <Button type="button" variant="outline" style={{ height: 44 }} onClick={() => { setAddOpen(false); resetForm() }} disabled={saving}>Cancel</Button>
              <Button type="submit" style={{ height: 44, flex: 1 }} disabled={saving}>{saving ? 'Saving…' : 'Add Customer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

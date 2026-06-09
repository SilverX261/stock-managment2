'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SaleDetailModal } from '@/components/sales/sale-detail-modal'
import { WhatsAppShare } from '@/components/sales/whatsapp-share'
import { salePrimaryLabel, PAYMENT_LABELS, warrantyLabel, warrantyExpiry } from '@/components/sales/types'
import type { SaleFull } from '@/components/sales/types'
import {
  ArrowLeft, User, Phone, MapPin, Calendar,
  ShoppingBag, TrendingUp, Pencil, ShieldCheck,
  AlertTriangle, Plus, CheckCircle2, RefreshCw,
} from 'lucide-react'
import type { Customer, CustomerReturn, CustomerReturnInsert } from '@/types/database'

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`

const SALE_SELECT = `
  *,
  customer:customers(id, name, phone),
  sale_items(
    id, item_type, quantity, sell_price_snapshot, cost_price_snapshot,
    laptop:laptops(id, brand, model, processor, base_ram_gb, base_storage_gb, storage_type, display_size),
    component:components(id, name, category, specification)
  )
` as const

type ReturnStatus = 'complaint' | 'exchange' | 'resolved'

const STATUS_CONFIG: Record<ReturnStatus, {
  label: string; variant: 'warning' | 'info' | 'success'; icon: React.ElementType
}> = {
  complaint: { label: 'Complaint', variant: 'warning', icon: AlertTriangle },
  exchange:  { label: 'Exchange',  variant: 'info',    icon: RefreshCw },
  resolved:  { label: 'Resolved',  variant: 'success', icon: CheckCircle2 },
}

const CARD: React.CSSProperties = {
  backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20, marginBottom: 16,
}

interface Props { customerId: string }

export function CustomerProfile({ customerId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()

  const [customer,   setCustomer]   = useState<Customer | null>(null)
  const [sales,      setSales]      = useState<SaleFull[]>([])
  const [returns,    setReturns]    = useState<CustomerReturn[]>([])
  const [loading,    setLoading]    = useState(true)
  const [detailSale, setDetailSale] = useState<SaleFull | null>(null)

  const [editOpen,    setEditOpen]    = useState(false)
  const [editName,    setEditName]    = useState('')
  const [editPhone,   setEditPhone]   = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNotes,   setEditNotes]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [editError,   setEditError]   = useState<string | null>(null)

  const [logOpen,   setLogOpen]   = useState(false)
  const [retSaleId, setRetSaleId] = useState<string>('')
  const [retIssue,  setRetIssue]  = useState('')
  const [retStatus, setRetStatus] = useState<ReturnStatus>('complaint')
  const [retNotes,  setRetNotes]  = useState('')
  const [retSaving, setRetSaving] = useState(false)
  const [retError,  setRetError]  = useState<string | null>(null)

  const fetchReturns = useCallback(async () => {
    const { data } = await supabase
      .from('customer_returns')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    setReturns((data ?? []) as CustomerReturn[])
  }, [customerId, supabase])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [custRes, salesRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', customerId).single(),
        supabase.from('sales').select(SALE_SELECT)
          .eq('customer_id', customerId)
          .order('sale_date', { ascending: false }),
      ])
      if (custRes.data)  setCustomer(custRes.data)
      if (salesRes.data) setSales(salesRes.data as unknown as SaleFull[])
      setLoading(false)
    }
    load()
    fetchReturns()
  }, [customerId, supabase, fetchReturns])

  function openEdit() {
    if (!customer) return
    setEditName(customer.name)
    setEditPhone(customer.phone ?? '')
    setEditAddress(customer.address ?? '')
    setEditNotes(customer.notes ?? '')
    setEditError(null)
    setEditOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) { setEditError('Name is required.'); return }
    setSaving(true); setEditError(null)
    const { error } = await supabase.from('customers').update({
      name: editName.trim(), phone: editPhone.trim() || null,
      address: editAddress.trim() || null, notes: editNotes.trim() || null,
    }).eq('id', customerId)
    if (error) { setEditError(error.message); setSaving(false); return }
    setCustomer(prev => prev ? {
      ...prev,
      name: editName.trim(), phone: editPhone.trim() || null,
      address: editAddress.trim() || null, notes: editNotes.trim() || null,
    } : null)
    setSaving(false); setEditOpen(false)
  }

  function openLog() {
    setRetSaleId(sales[0]?.id ?? '')
    setRetIssue(''); setRetStatus('complaint'); setRetNotes(''); setRetError(null)
    setLogOpen(true)
  }

  async function handleLogReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!retIssue.trim()) { setRetError('Issue description is required.'); return }
    setRetSaving(true); setRetError(null)
    const payload: CustomerReturnInsert = {
      customer_id: customerId, sale_id: retSaleId || null,
      issue: retIssue.trim(), status: retStatus, resolution_notes: retNotes.trim() || null,
    }
    const { error } = await supabase.from('customer_returns').insert(payload)
    if (error) { setRetError(error.message); setRetSaving(false); return }
    await fetchReturns(); setRetSaving(false); setLogOpen(false)
  }

  async function updateReturnStatus(id: string, status: ReturnStatus) {
    await supabase.from('customer_returns').update({ status }).eq('id', id)
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid #F0EEE8', borderTopColor: '#F97316', borderRadius: '50%' }} />
      </div>
    )
  }

  if (!customer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
        <p style={{ fontSize: 14, color: '#A1A1AA' }}>Customer not found</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const totalSpend  = sales.reduce((s, sale) => s + sale.total_sell_price, 0)
  const totalProfit = sales.reduce((s, sale) => s + (sale.total_sell_price - sale.total_cost_price), 0)
  const openReturns = returns.filter(r => r.status !== 'resolved').length

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#A1A1AA', marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0A0A0A' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA' }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        All Customers
      </button>

      {/* Profile card */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User style={{ width: 22, height: 22, color: '#F97316' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>{customer.name}</h2>
              {customer.phone && (
                <p style={{ fontSize: 13, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Phone style={{ width: 12, height: 12 }} /> {customer.phone}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" style={{ flexShrink: 0, height: 32 }} onClick={openEdit}>
            <Pencil style={{ width: 12, height: 12 }} /> Edit
          </Button>
        </div>

        {customer.address && (
          <p style={{ fontSize: 13, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} /> {customer.address}
          </p>
        )}
        {customer.notes && (
          <p style={{ fontSize: 13, color: '#A1A1AA', fontStyle: 'italic', marginBottom: 4 }}>{customer.notes}</p>
        )}

        <Separator style={{ margin: '12px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A' }}>{sales.length}</p>
            <p style={{ fontSize: 11, color: '#A1A1AA' }}>Purchases</p>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.2 }}>{pkr(totalSpend)}</p>
            <p style={{ fontSize: 11, color: '#A1A1AA' }}>Total Spent</p>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: totalProfit >= 0 ? '#059669' : '#EF4444', lineHeight: 1.2 }}>{pkr(totalProfit)}</p>
            <p style={{ fontSize: 11, color: '#A1A1AA' }}>Profit</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="purchases">
        <TabsList style={{ width: '100%', marginBottom: 16, height: 44 }}>
          <TabsTrigger value="purchases" style={{ flex: 1, height: 36, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag style={{ width: 14, height: 14 }} />
            Purchases
            {sales.length > 0 && <span style={{ color: '#A1A1AA', fontSize: 12 }}>({sales.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="returns" style={{ flex: 1, height: 36, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle style={{ width: 14, height: 14 }} />
            Returns
            {openReturns > 0 && (
              <Badge variant="destructive" style={{ fontSize: 10, height: 16, padding: '0 6px', marginLeft: 2 }}>{openReturns}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Purchases ── */}
        <TabsContent value="purchases">
          {sales.length === 0 ? (
            <p style={{ fontSize: 13, color: '#A1A1AA', textAlign: 'center', padding: '32px 0' }}>No purchases yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sales.map(sale => {
                const profit  = sale.total_sell_price - sale.total_cost_price
                const margin  = sale.total_sell_price > 0 ? ((profit / sale.total_sell_price) * 100).toFixed(1) : '0'
                const dateStr = new Date(sale.sale_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <div key={sale.id}
                    style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 14, transition: 'box-shadow 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{salePrimaryLabel(sale)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar style={{ width: 11, height: 11 }} /> {dateStr}
                          </span>
                          <Badge variant="secondary" style={{ fontSize: 10, height: 16, padding: '0 6px' }}>
                            {PAYMENT_LABELS[sale.payment_type]}
                          </Badge>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <Button variant="ghost" size="sm" style={{ height: 28, padding: '0 8px', fontSize: 12 }} onClick={() => setDetailSale(sale)}>View</Button>
                        <WhatsAppShare sale={sale} size="sm" variant="ghost" label="" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, paddingTop: 8, borderTop: '1px solid #F0EEE8' }}>
                      <span style={{ color: '#A1A1AA' }}>
                        Sell: <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{pkr(sale.total_sell_price)}</span>
                      </span>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: profit >= 0 ? '#059669' : '#EF4444' }}>
                        <TrendingUp style={{ width: 13, height: 13 }} />
                        {pkr(profit)} ({margin}%)
                      </span>
                    </div>

                    {(sale.warranty_days > 0 || sale.specs_promised) && (
                      <div style={{ paddingTop: 8, marginTop: 8, borderTop: '1px solid #F0EEE8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {sale.warranty_days > 0 && (
                          <p style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck style={{ width: 11, height: 11, color: '#3B82F6', flexShrink: 0 }} />
                            {warrantyLabel(sale.warranty_days)} warranty
                            {warrantyExpiry(sale.sale_date, sale.warranty_days) && (
                              <span>· expires {warrantyExpiry(sale.sale_date, sale.warranty_days)}</span>
                            )}
                          </p>
                        )}
                        {sale.specs_promised && (
                          <p style={{ fontSize: 11, color: '#A1A1AA', lineHeight: 1.5 }}>{sale.specs_promised}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Returns ── */}
        <TabsContent value="returns">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#A1A1AA' }}>
              {returns.length === 0 ? 'No complaints or returns logged' : `${returns.length} record${returns.length !== 1 ? 's' : ''}`}
            </p>
            <Button size="sm" style={{ height: 32 }} onClick={openLog}>
              <Plus style={{ width: 12, height: 12 }} /> Log Return
            </Button>
          </div>

          {returns.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <CheckCircle2 style={{ width: 22, height: 22, color: '#A1A1AA' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>No issues logged</p>
              <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 4 }}>If a customer returns with a complaint, log it here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {returns.map(ret => {
                const conf        = STATUS_CONFIG[ret.status]
                const StatusIcon  = conf.icon
                const saleForRet  = sales.find(s => s.id === ret.sale_id)
                const dateStr     = new Date(ret.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <div key={ret.id} style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {saleForRet && (
                          <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 4 }}>Re: {salePrimaryLabel(saleForRet)}</p>
                        )}
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', lineHeight: 1.4 }}>{ret.issue}</p>
                      </div>
                      <Badge variant={conf.variant} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize', fontSize: 11 }}>
                        <StatusIcon style={{ width: 11, height: 11 }} />
                        {conf.label}
                      </Badge>
                    </div>

                    {ret.resolution_notes && (
                      <p style={{ fontSize: 11, color: '#A1A1AA', backgroundColor: '#F5F2EC', borderRadius: 8, padding: '8px 12px', marginBottom: 8, lineHeight: 1.5 }}>
                        {ret.resolution_notes}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #F0EEE8' }}>
                      <span style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar style={{ width: 11, height: 11 }} /> {dateStr}
                      </span>
                      {ret.status !== 'resolved' && (
                        <Button variant="ghost" size="sm"
                          style={{ height: 24, padding: '0 8px', fontSize: 11, color: '#A1A1AA' }}
                          onClick={() => updateReturnStatus(ret.id, ret.status === 'complaint' ? 'exchange' : 'resolved')}>
                          Mark {ret.status === 'complaint' ? 'Exchange' : 'Resolved'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit customer dialog */}
      <Dialog open={editOpen} onOpenChange={v => setEditOpen(v)}>
        <DialogContent style={{ maxWidth: '380px' }}>
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="e-name">Name *</Label>
              <Input id="e-name" style={{ height: 44 }} value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="e-phone">Phone</Label>
              <Input id="e-phone" style={{ height: 44 }} value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="e-addr">Address</Label>
              <Input id="e-addr" style={{ height: 44 }} value={editAddress} onChange={e => setEditAddress(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="e-notes">Notes</Label>
              <Textarea id="e-notes" rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
            </div>
            {editError && (
              <p style={{ fontSize: 13, color: '#EF4444', backgroundColor: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>{editError}</p>
            )}
            <DialogFooter style={{ flexDirection: 'row', gap: 8 }}>
              <Button type="button" variant="outline" style={{ height: 44 }} onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" style={{ height: 44, flex: 1 }} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log return dialog */}
      <Dialog open={logOpen} onOpenChange={v => { setLogOpen(v); if (!v) setRetError(null) }}>
        <DialogContent style={{ maxWidth: '380px' }}>
          <DialogHeader><DialogTitle>Log Return / Complaint</DialogTitle></DialogHeader>
          <form onSubmit={handleLogReturn} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {sales.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label>Related Sale (optional)</Label>
                <Select value={retSaleId} onValueChange={setRetSaleId}>
                  <SelectTrigger style={{ height: 44 }}><SelectValue placeholder="Select a sale…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {sales.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {salePrimaryLabel(s)} — {new Date(s.sale_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="ret-issue">Issue / Complaint *</Label>
              <Textarea id="ret-issue" rows={3} placeholder="Describe the problem…" value={retIssue} onChange={e => setRetIssue(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>Status</Label>
              <Select value={retStatus} onValueChange={v => setRetStatus(v as ReturnStatus)}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="exchange">Exchange</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="ret-notes">
                Resolution Notes <span style={{ fontSize: 12, fontWeight: 400, color: '#A1A1AA', marginLeft: 6 }}>optional</span>
              </Label>
              <Textarea id="ret-notes" rows={2} placeholder="How was it resolved?…" value={retNotes} onChange={e => setRetNotes(e.target.value)} />
            </div>
            {retError && (
              <p style={{ fontSize: 13, color: '#EF4444', backgroundColor: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>{retError}</p>
            )}
            <DialogFooter style={{ flexDirection: 'row', gap: 8 }}>
              <Button type="button" variant="outline" style={{ height: 44 }} onClick={() => setLogOpen(false)} disabled={retSaving}>Cancel</Button>
              <Button type="submit" style={{ height: 44, flex: 1 }} disabled={retSaving}>
                {retSaving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />
    </div>
  )
}

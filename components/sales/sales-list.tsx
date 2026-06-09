'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { SaleForm } from './sale-form'
import { SaleDetailModal } from './sale-detail-modal'
import { WhatsAppShare } from './whatsapp-share'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ShoppingBag, TrendingUp, TrendingDown, User, Search } from 'lucide-react'
import { makeFuse } from '@/lib/fuzzy'
import { salePrimaryLabel, saleConfigSummary, PAYMENT_LABELS } from './types'
import type { SaleFull } from './types'

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`
const CARD: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 16, cursor: 'pointer', transition: 'box-shadow 150ms' }

const SALE_SELECT = `
  *,
  customer:customers(id, name, phone),
  sale_items(
    id, item_type, quantity, sell_price_snapshot, cost_price_snapshot,
    laptop:laptops(id, brand, model, processor, base_ram_gb, base_storage_gb, storage_type, display_size),
    component:components(id, name, category, specification)
  )
` as const

export function SalesList() {
  const supabase = useMemo(() => createClient(), [])
  const [sales,      setSales]      = useState<SaleFull[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [formOpen,   setFormOpen]   = useState(false)
  const [detailSale, setDetailSale] = useState<SaleFull | null>(null)
  const [query,      setQuery]      = useState('')

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('sales').select(SALE_SELECT)
      .order('sale_date', { ascending: false }).order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setSales((data ?? []) as unknown as SaleFull[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchSales() }, [fetchSales])
  useEffect(() => {
    const ch = supabase.channel('sales-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetchSales).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, fetchSales])

  const saleSearch = useMemo(() => sales.map(s => ({
    ...s,
    _label: salePrimaryLabel(s),
    _cust:  s.customer?.name  ?? '',
    _phone: s.customer?.phone ?? '',
  })), [sales])

  const saleFuse = useMemo(
    () => makeFuse(saleSearch, [
      { name: '_label', weight: 2 },
      { name: '_cust',  weight: 2 },
      { name: '_phone', weight: 1 },
    ]),
    [saleSearch]
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return sales
    return saleFuse.search(query).map(r => r.item)
  }, [saleFuse, sales, query])

  const totalRevenue = sales.reduce((s, sale) => s + sale.total_sell_price, 0)
  const totalProfit  = sales.reduce((s, sale) => s + (sale.total_sell_price - sale.total_cost_price), 0)

  return (
    <div>
      {sales.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 11, color: '#A1A1AA' }}>Total Revenue</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginTop: 2 }}>{pkr(totalRevenue)}</p>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 11, color: '#A1A1AA' }}>Total Profit</p>
            <p style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: totalProfit >= 0 ? '#059669' : '#EF4444' }}>{pkr(totalProfit)}</p>
          </div>
        </div>
      )}

      <div className="fc-list-toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#A1A1AA' }} />
          <Input placeholder="Search by laptop, customer, phone…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 36, height: 44 }} />
        </div>
        <Button style={{ height: 44, flexShrink: 0 }} onClick={() => setFormOpen(true)}>
          <Plus style={{ width: 15, height: 15 }} /> New Sale
        </Button>
      </div>

      {error && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="fc-pulse" style={{ height: 96, borderRadius: 16, backgroundColor: '#F5F2EC' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <ShoppingBag style={{ width: 24, height: 24, color: '#A1A1AA' }} />
          </div>
          <p style={{ fontWeight: 600, color: '#0A0A0A' }}>{query ? 'No matching sales' : 'No sales yet'}</p>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>
            {query ? 'No results found — try a different search term' : 'Create a sale from Config Builder or tap New Sale'}
          </p>
          {!query && (
            <Button style={{ marginTop: 16 }} onClick={() => setFormOpen(true)}>
              <Plus style={{ width: 15, height: 15 }} /> New Sale
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(sale => {
            const profit       = sale.total_sell_price - sale.total_cost_price
            const margin       = sale.total_sell_price > 0 ? ((profit / sale.total_sell_price) * 100).toFixed(1) : '0'
            const dateStr      = new Date(sale.sale_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
            const configSummary= saleConfigSummary(sale)
            return (
              <div key={sale.id} role="button" tabIndex={0} onClick={() => setDetailSale(sale)}
                onKeyDown={e => e.key === 'Enter' && setDetailSale(sale)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
                style={CARD}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>{salePrimaryLabel(sale)}</p>
                    {configSummary && <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>+ {configSummary}</p>}
                  </div>
                  <div onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                    <WhatsAppShare sale={sale} size="sm" variant="ghost" label="" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#A1A1AA' }}>{dateStr}</span>
                  <span style={{ backgroundColor: '#F5F2EC', color: '#3F3F46', padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{PAYMENT_LABELS[sale.payment_type]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F0EEE8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#A1A1AA' }}>
                    <User style={{ width: 12, height: 12 }} />
                    {sale.customer?.name ?? 'Walk-in Customer'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: '#A1A1AA', display: 'block' }}>Sell</span>
                      <span style={{ fontWeight: 600 }}>{pkr(sale.total_sell_price)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: '#A1A1AA', display: 'block' }}>Profit</span>
                      <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, color: profit >= 0 ? '#059669' : '#EF4444' }}>
                        {profit >= 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
                        {pkr(profit)} <span style={{ fontSize: 10, fontWeight: 400 }}>({margin}%)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SaleForm open={formOpen} onOpenChange={setFormOpen} onCreated={fetchSales} />
      <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { KpiCards } from './kpi-cards'
import { RevenueChart } from './revenue-chart'
import { CategoryChart } from './category-chart'
import { RecentSalesTable } from './recent-sales-table'
import { DailySummaryModal } from './daily-summary-modal'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import type { SaleFull } from '@/components/sales/types'

const SALE_SELECT = `
  *,
  customer:customers(id, name, phone),
  sale_items(
    id, item_type, quantity, sell_price_snapshot, cost_price_snapshot,
    laptop:laptops(id, brand, model, processor, base_ram_gb, base_storage_gb, storage_type, display_size),
    component:components(id, name, category, specification)
  )
` as const

function buildLast7Days(): { iso: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const iso   = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit' })
    return { iso, label }
  })
}

export function DashboardView() {
  const supabase = useMemo(() => createClient(), [])
  const [sales,          setSales]          = useState<SaleFull[]>([])
  const [laptopStock,    setLaptopStock]    = useState(0)
  const [componentStock, setComponentStock] = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [summaryOpen,    setSummaryOpen]    = useState(false)

  useEffect(() => {
    async function load() {
      const sevenAgo = new Date()
      sevenAgo.setDate(sevenAgo.getDate() - 6)
      const since = sevenAgo.toISOString().split('T')[0]

      const [salesRes, laptopRes, compRes] = await Promise.all([
        supabase.from('sales').select(SALE_SELECT)
          .gte('sale_date', since)
          .order('sale_date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('laptops').select('quantity'),
        supabase.from('components').select('quantity'),
      ])

      setSales((salesRes.data ?? []) as unknown as SaleFull[])
      setLaptopStock((laptopRes.data ?? []).reduce((s: number, l: { quantity: number }) => s + l.quantity, 0))
      setComponentStock((compRes.data ?? []).reduce((s: number, c: { quantity: number }) => s + c.quantity, 0))
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 0' }}>
        <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid #F0EEE8', borderTopColor: '#F97316', borderRadius: '50%' }} />
      </div>
    )
  }

  const today      = new Date().toISOString().split('T')[0]
  const todaySales = sales.filter(s => s.sale_date === today)
  const todayRev   = todaySales.reduce((s, sale) => s + sale.total_sell_price, 0)
  const todayProfit= todaySales.reduce((s, sale) => s + (sale.total_sell_price - sale.total_cost_price), 0)

  const days    = buildLast7Days()
  const barData = days.map(({ iso, label }) => {
    const ds = sales.filter(s => s.sale_date === iso)
    return {
      date:    label,
      revenue: ds.reduce((s, sale) => s + sale.total_sell_price, 0),
      profit:  ds.reduce((s, sale) => s + (sale.total_sell_price - sale.total_cost_price), 0),
    }
  })

  const laptopSales   = sales.filter(s => s.sale_items.some(i => i.item_type === 'laptop'))
  const compOnlySales = sales.filter(s => s.sale_items.every(i => i.item_type === 'component'))
  const upgradeItems  = sales
    .filter(s => s.sale_items.some(i => i.item_type === 'laptop'))
    .flatMap(s => s.sale_items.filter(i => i.item_type === 'component'))

  const donutData = [
    { name: 'Laptops',     value: laptopSales.length,   amount: laptopSales.reduce((s, sale) => s + sale.total_sell_price, 0) - upgradeItems.reduce((s, i) => s + i.sell_price_snapshot * i.quantity, 0) },
    { name: 'Accessories', value: upgradeItems.length > 0 ? laptopSales.filter(s => s.sale_items.some(i => i.item_type === 'component')).length : 0, amount: upgradeItems.reduce((s, i) => s + i.sell_price_snapshot * i.quantity, 0) },
    { name: 'Components',  value: compOnlySales.length, amount: compOnlySales.reduce((s, sale) => s + sale.total_sell_price, 0) },
  ].filter(d => d.value > 0)

  const recentSales = [...sales].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" size="sm" onClick={() => setSummaryOpen(true)}>
          <FileText style={{ width: 15, height: 15 }} />
          Daily Summary
        </Button>
      </div>

      <KpiCards data={{ todaySales: todayRev, todayProfit, laptopStock, componentStock }} />
      <RevenueChart data={barData} />
      <CategoryChart data={donutData} />
      <RecentSalesTable sales={recentSales} />

      <DailySummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        sales={todaySales}
        laptopStock={laptopStock}
        componentStock={componentStock}
      />
    </div>
  )
}

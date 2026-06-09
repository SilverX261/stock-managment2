// ── Shared types for analytics data ──────────────────────────

export type SaleRow = {
  id: string
  sale_date: string
  total_sell_price: number
  total_cost_price: number
  sale_items: SaleItemRow[]
}

export type SaleItemRow = {
  item_type: 'laptop' | 'component'
  quantity: number
  sell_price_snapshot: number
  cost_price_snapshot: number
  laptop: { brand: string; model: string } | null
  component: { name: string; category: string } | null
}

export type DateRange = 'week' | 'month' | 'year' | 'all'
export type ChartView = 'daily' | 'weekly' | 'monthly'

export interface BarPoint {
  label: string
  revenue: number
  profit: number
}

export interface BrandPoint {
  name: string
  value: number  // raw value (profit PKR or unit count)
}

// ── Date helpers ─────────────────────────────────────────────

export function rangeStart(range: DateRange): string | null {
  if (range === 'all') return null
  const d = new Date()
  if (range === 'week') {
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  } else if (range === 'month') {
    d.setDate(1)
  } else {
    d.setMonth(0, 1)
  }
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export function filterSales(sales: SaleRow[], range: DateRange): SaleRow[] {
  const start = rangeStart(range)
  if (!start) return sales
  return sales.filter(s => s.sale_date >= start)
}

// ── Bar chart data builders ───────────────────────────────────

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit' })
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' })
}

export function buildBarData(sales: SaleRow[], view: ChartView, range: DateRange): BarPoint[] {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  if (view === 'daily') {
    // Show days in range, max 31
    let startDate: Date
    if (range === 'week') {
      const d = new Date(today)
      const day = d.getDay()
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      startDate = d
    } else if (range === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (range === 'year') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    } else {
      startDate = addDays(today, -29)
    }

    const points: BarPoint[] = []
    const cursor = new Date(startDate)
    while (cursor <= today) {
      const iso = isoDate(cursor)
      const daySales = sales.filter(s => s.sale_date === iso)
      points.push({
        label: dayLabel(cursor),
        revenue: daySales.reduce((s, x) => s + x.total_sell_price, 0),
        profit:  daySales.reduce((s, x) => s + (x.total_sell_price - x.total_cost_price), 0),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    return points
  }

  if (view === 'weekly') {
    // Last 12 weeks
    const monday = new Date(today)
    const day = monday.getDay()
    monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))

    const weeks: BarPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const wStart = addDays(monday, -i * 7)
      const wEnd   = addDays(wStart, 6)
      const wSales = sales.filter(s => s.sale_date >= isoDate(wStart) && s.sale_date <= isoDate(wEnd))
      weeks.push({
        label: wStart.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }),
        revenue: wSales.reduce((s, x) => s + x.total_sell_price, 0),
        profit:  wSales.reduce((s, x) => s + (x.total_sell_price - x.total_cost_price), 0),
      })
    }
    return weeks
  }

  // Monthly — last 12 months
  const points: BarPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const mStr = isoDate(d).slice(0, 7) // "YYYY-MM"
    const mSales = sales.filter(s => s.sale_date.startsWith(mStr))
    points.push({
      label: monthLabel(d),
      revenue: mSales.reduce((s, x) => s + x.total_sell_price, 0),
      profit:  mSales.reduce((s, x) => s + (x.total_sell_price - x.total_cost_price), 0),
    })
  }
  return points
}

// ── Brand aggregations ────────────────────────────────────────

export function buildBrandProfitData(sales: SaleRow[]): BrandPoint[] {
  const map: Record<string, number> = {}
  for (const sale of sales) {
    for (const item of sale.sale_items) {
      if (item.item_type === 'laptop' && item.laptop) {
        const profit = (item.sell_price_snapshot - item.cost_price_snapshot) * item.quantity
        map[item.laptop.brand] = (map[item.laptop.brand] ?? 0) + profit
      }
    }
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function buildBrandVolumeData(sales: SaleRow[]): BrandPoint[] {
  const map: Record<string, number> = {}
  for (const sale of sales) {
    for (const item of sale.sale_items) {
      if (item.item_type === 'laptop' && item.laptop) {
        map[item.laptop.brand] = (map[item.laptop.brand] ?? 0) + item.quantity
      }
    }
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

// ── Summary stats (always all-time) ──────────────────────────

export function buildSummaryStats(all: SaleRow[]) {
  const totalRevenue = all.reduce((s, x) => s + x.total_sell_price, 0)
  const totalProfit  = all.reduce((s, x) => s + (x.total_sell_price - x.total_cost_price), 0)
  const totalUnits   = all.reduce((s, x) => s + x.sale_items.reduce((u, i) => u + i.quantity, 0), 0)
  const avgProfit    = all.length ? totalProfit / all.length : 0

  // Best-selling laptop model
  const modelCount: Record<string, number> = {}
  for (const sale of all) {
    for (const item of sale.sale_items) {
      if (item.item_type === 'laptop' && item.laptop) {
        const key = `${item.laptop.brand} ${item.laptop.model}`
        modelCount[key] = (modelCount[key] ?? 0) + item.quantity
      }
    }
  }
  const bestModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  return { totalRevenue, totalProfit, totalUnits, avgProfit, bestModel, saleCount: all.length }
}

// ── Top 5 configs by profit margin ───────────────────────────

export type TopConfig = {
  id: string
  laptopModel: string
  components: string
  sellPrice: number
  margin: number
}

export function buildTopConfigs(sales: SaleRow[]): TopConfig[] {
  return sales
    .filter(s => s.total_sell_price > 0)
    .map(s => {
      const laptopItem = s.sale_items.find(i => i.item_type === 'laptop')
      const compItems  = s.sale_items.filter(i => i.item_type === 'component')
      const laptopModel = laptopItem?.laptop
        ? `${laptopItem.laptop.brand} ${laptopItem.laptop.model}`
        : 'Component Sale'
      const components = compItems.length
        ? compItems.map(i => i.component?.name ?? '').filter(Boolean).join(', ')
        : '—'
      const margin = ((s.total_sell_price - s.total_cost_price) / s.total_sell_price) * 100
      return { id: s.id, laptopModel, components, sellPrice: s.total_sell_price, margin }
    })
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5)
}

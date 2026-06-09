'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { PeriodBarChart } from './period-bar-chart'
import { BrandDonut } from './brand-donut'
import { SummaryStats } from './summary-stats'
import { TopConfigsTable } from './top-configs-table'
import {
  filterSales, buildBarData, buildBrandProfitData,
  buildBrandVolumeData, buildSummaryStats, buildTopConfigs,
} from './analytics-types'
import type { SaleRow, DateRange, ChartView } from './analytics-types'

const SALE_SELECT = `
  id, sale_date, total_sell_price, total_cost_price,
  sale_items(
    item_type, quantity, sell_price_snapshot, cost_price_snapshot,
    laptop:laptops(brand, model),
    component:components(name, category)
  )
` as const

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year' },
  { value: 'all',   label: 'All Time' },
]
const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

export function AnalyticsView() {
  const supabase = useMemo(() => createClient(), [])
  const [allSales,   setAllSales]   = useState<SaleRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [dateRange,  setDateRange]  = useState<DateRange>('month')
  const [chartView,  setChartView]  = useState<ChartView>('daily')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('sales').select(SALE_SELECT).order('sale_date', { ascending: true })
      setAllSales((data ?? []) as unknown as SaleRow[])
      setLoading(false)
    }
    load()
  }, [supabase])

  function handleRangeChange(range: DateRange) {
    setDateRange(range)
    if (range === 'week' || range === 'month') setChartView('daily')
    if (range === 'year' || range === 'all')   setChartView('monthly')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 0' }}>
        <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid #F0EEE8', borderTopColor: '#F97316', borderRadius: '50%' }} />
      </div>
    )
  }

  const filtered    = filterSales(allSales, dateRange)
  const barData     = buildBarData(filtered, chartView, dateRange)
  const brandProfit = buildBrandProfitData(filtered)
  const brandVolume = buildBrandVolumeData(filtered)
  const summary     = buildSummaryStats(allSales)
  const topConfigs  = buildTopConfigs(filtered)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Date range filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DATE_RANGES.map(({ value, label }) => {
          const active = dateRange === value
          return (
            <button key={value} onClick={() => handleRangeChange(value)}
              style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: '1px solid', transition: 'background-color 120ms, color 120ms, border-color 120ms',
                backgroundColor: active ? '#F97316' : '#FFFFFF',
                color:           active ? '#FFFFFF' : '#A1A1AA',
                borderColor:     active ? '#F97316' : '#F0EEE8',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAF8'; (e.currentTarget as HTMLButtonElement).style.color = '#3F3F46' } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA' } }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <PeriodBarChart data={barData} view={chartView} onViewChange={setChartView} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 16, width: '100%', boxSizing: 'border-box' }}>
        <BrandDonut title="Profit by Laptop Brand" data={brandProfit}
          formatValue={v => pkr(v)} centerLabel={pkr(brandProfit.reduce((s, d) => s + d.value, 0))} />
        <BrandDonut title="Units Sold by Laptop Brand" data={brandVolume}
          formatValue={v => `${v} unit${v !== 1 ? 's' : ''}`} centerLabel={`${brandVolume.reduce((s, d) => s + d.value, 0)} units`} />
      </div>

      <SummaryStats totalRevenue={summary.totalRevenue} totalProfit={summary.totalProfit}
        totalUnits={summary.totalUnits} avgProfit={summary.avgProfit}
        bestModel={summary.bestModel} saleCount={summary.saleCount} />

      <TopConfigsTable configs={topConfigs} />
    </div>
  )
}

'use client'

import { TrendingUp, ShoppingBag, Monitor, Star, BarChart3 } from 'lucide-react'

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

interface Props {
  totalRevenue: number
  totalProfit: number
  totalUnits: number
  avgProfit: number
  bestModel: string
  saleCount: number
}

export function SummaryStats({ totalRevenue, totalProfit, totalUnits, avgProfit, bestModel, saleCount }: Props) {
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'

  const stats = [
    { label: 'All-Time Revenue', value: pkr(totalRevenue), sub: `${saleCount} sale${saleCount !== 1 ? 's' : ''}`, icon: TrendingUp, iconBg: '#D1FAE5', iconColor: '#059669' },
    { label: 'All-Time Profit',  value: pkr(totalProfit),  sub: `${margin}% margin`, icon: BarChart3, iconBg: totalProfit >= 0 ? '#D1FAE5' : '#FEE2E2', iconColor: totalProfit >= 0 ? '#059669' : '#EF4444' },
    { label: 'Units Sold',       value: totalUnits.toString(), sub: 'laptops + parts', icon: ShoppingBag, iconBg: '#FFF7ED', iconColor: '#EA580C' },
    { label: 'Avg Profit / Sale',value: pkr(avgProfit),    sub: 'per transaction', icon: Monitor, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
    { label: 'Best Seller',      value: bestModel || '—',  sub: 'most sold model', icon: Star,    iconBg: '#FEF3C7', iconColor: '#B45309' },
  ]

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginBottom: 12 }}>All-Time Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon style={{ width: 16, height: 16, color: iconColor }} />
            </div>
            <p style={{ fontSize: 12, color: '#A1A1AA', lineHeight: 1.3 }}>{label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginTop: 3, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</p>
            <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 3 }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

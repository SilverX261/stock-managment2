'use client'

import { TrendingUp, TrendingDown, User } from 'lucide-react'
import type { SaleFull } from '@/components/sales/types'
import { salePrimaryLabel } from '@/components/sales/types'

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

export function RecentSalesTable({ sales }: { sales: SaleFull[] }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EEE8' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>Recent Sales</h2>
      </div>

      {sales.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', fontSize: 14, color: '#A1A1AA' }}>
          No sales yet
        </div>
      ) : (
        <div>
          {sales.map((sale, idx) => {
            const profit = sale.total_sell_price - sale.total_cost_price
            const dateStr = new Date(sale.sale_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
            return (
              <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: idx === 0 ? 'none' : '1px solid #F0EEE8' }}>
                <div style={{ flexShrink: 0, width: 40, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: '#A1A1AA' }}>{dateStr}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{salePrimaryLabel(sale)}</p>
                  <p style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <User style={{ width: 11, height: 11 }} />
                    {sale.customer?.name ?? 'Walk-in'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{pkr(sale.total_sell_price)}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: profit >= 0 ? '#059669' : '#EF4444' }}>
                    {profit >= 0 ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
                    {pkr(profit)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

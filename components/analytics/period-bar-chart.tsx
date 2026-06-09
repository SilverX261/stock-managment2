'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { BarPoint, ChartView } from './analytics-types'

const VIEWS: { value: ChartView; label: string }[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
]

function formatPKR(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return v.toString()
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '10px 14px', fontSize: 13, minWidth: 160 }}>
      <p style={{ fontWeight: 700, color: '#0A0A0A', marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A1A1AA' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: p.fill, display: 'inline-block' }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 600, color: '#3F3F46' }}>PKR {Math.round(p.value).toLocaleString('en-PK')}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: BarPoint[]
  view: ChartView
  onViewChange: (v: ChartView) => void
}

export function PeriodBarChart({ data, view, onViewChange }: Props) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 16, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>Revenue &amp; Profit</h2>
        <div style={{ display: 'flex', border: '1px solid #E4E2DC', borderRadius: 8, overflow: 'hidden', fontSize: 12 }}>
          {VIEWS.map((v, i) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              style={{
                padding: '6px 12px', fontWeight: 500, cursor: 'pointer',
                border: 'none', borderLeft: i > 0 ? '1px solid #E4E2DC' : 'none',
                backgroundColor: view === v.value ? '#F97316' : '#FFFFFF',
                color: view === v.value ? '#FFFFFF' : '#A1A1AA',
                transition: 'background-color 120ms, color 120ms',
              }}
              onMouseEnter={e => { if (view !== v.value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAF8' }}
              onMouseLeave={e => { if (view !== v.value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF' }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {data.every(d => d.revenue === 0) ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, fontSize: 14, color: '#A1A1AA' }}>
          No sales in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#A1A1AA', fontFamily: 'Inter' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={formatPKR} tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FAFAF8', opacity: 0.6 }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontFamily: 'Inter' }}
              formatter={(v) => <span style={{ color: '#A1A1AA', fontWeight: 500 }}>{v}</span>} />
            <Bar dataKey="revenue" name="Revenue" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="profit"  name="Profit"  fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { BrandPoint } from './analytics-types'

const COLORS = ['#F97316', '#0D9488', '#10B981', '#F59E0B', '#7C3AED', '#EF4444']

interface Props {
  title: string
  data: BrandPoint[]
  formatValue: (v: number) => string
  centerLabel?: string
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.07) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function makeTooltip(formatValue: (v: number) => string) {
  return function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: BrandPoint }[] }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '10px 14px', fontSize: 13 }}>
        <p style={{ fontWeight: 700, color: '#0A0A0A' }}>{d.name}</p>
        <p style={{ color: '#A1A1AA', marginTop: 4 }}>{formatValue(d.value)}</p>
      </div>
    )
  }
}

export function BrandDonut({ title, data, formatValue, centerLabel }: Props) {
  const TooltipComp = makeTooltip(formatValue)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginBottom: 2 }}>{title}</h2>
      <p style={{ fontSize: 12, color: '#A1A1AA', marginBottom: 12 }}>
        {centerLabel ?? formatValue(total)} total
      </p>

      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, fontSize: 14, color: '#A1A1AA' }}>
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="46%"
              innerRadius={52} outerRadius={86}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={CustomLabel as React.FC}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<TooltipComp />} />
            <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter' }}
              formatter={(v) => <span style={{ color: '#A1A1AA', fontWeight: 500 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

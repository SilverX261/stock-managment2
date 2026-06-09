'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface DayData { date: string; revenue: number; profit: number }

function fmtPKR(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return v.toString()
}

function Tip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '10px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: p.fill, display: 'inline-block' }} />
          <span style={{ color: '#A1A1AA' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#3F3F46' }}>PKR {Math.round(p.value).toLocaleString('en-PK')}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data }: { data: DayData[] }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>Revenue &amp; Profit</h2>
        <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>Last 7 days</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtPKR} tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<Tip />} cursor={{ fill: '#FAFAF8', radius: 6 }} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '14px', fontFamily: 'Inter' }}
            formatter={(v) => <span style={{ color: '#A1A1AA', fontWeight: 500 }}>{v}</span>} />
          <Bar dataKey="revenue" name="Revenue" fill="#F97316" radius={[6,6,0,0]} maxBarSize={36} />
          <Bar dataKey="profit"  name="Profit"  fill="#0D9488" radius={[6,6,0,0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

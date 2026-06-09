'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface D { name: string; value: number; amount: number }
const COLORS = ['#F97316', '#0D9488', '#10B981', '#F59E0B']

function Tip({ active, payload }: { active?: boolean; payload?: { payload: D }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '10px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: '#0A0A0A' }}>{d.name}</p>
      <p style={{ color: '#A1A1AA', marginTop: 2 }}>{d.value} sale{d.value !== 1 ? 's' : ''} · PKR {Math.round(d.amount).toLocaleString('en-PK')}</p>
    </div>
  )
}

function Lbl({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.05) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fontFamily="Inter">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CategoryChart({ data }: { data: D[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>Sales by Category</h2>
        <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>{total} total sales</p>
      </div>
      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#A1A1AA', fontSize: 14 }}>No sales yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" labelLine={false} label={Lbl as React.FC}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter' }}
              formatter={(v) => <span style={{ color: '#A1A1AA', fontWeight: 500 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

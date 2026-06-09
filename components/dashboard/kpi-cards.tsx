'use client'

import { TrendingUp, TrendingDown, Monitor, Cpu } from 'lucide-react'

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

interface KpiData {
  todaySales: number
  todayProfit: number
  laptopStock: number
  componentStock: number
}

function KpiCard({ label, value, Icon, iconBg, iconColor, valueColor }: {
  label: string; value: string; Icon: React.ComponentType<{ style?: React.CSSProperties }>
  iconBg: string; iconColor: string; valueColor?: string
}) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border:          '1px solid #F0EEE8',
      borderRadius:    20,
      boxShadow:       '0 2px 8px rgba(0,0,0,0.06)',
      padding:         20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#A1A1AA' }}>{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 16, height: 16, color: iconColor }} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.5px', color: valueColor ?? '#0A0A0A' }}>
        {value}
      </p>
    </div>
  )
}

export function KpiCards({ data }: { data: KpiData }) {
  const pos = data.todayProfit >= 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
      <KpiCard label="Today's Revenue"  value={pkr(data.todaySales)}  Icon={TrendingUp}                    iconBg="#FFF7ED"  iconColor="#F97316" />
      <KpiCard label="Today's Profit"   value={pkr(data.todayProfit)} Icon={pos ? TrendingUp : TrendingDown} iconBg={pos ? '#CCFBF1' : '#FEE2E2'} iconColor={pos ? '#0D9488' : '#EF4444'} valueColor={pos ? '#0D9488' : '#EF4444'} />
      <KpiCard label="Laptops in Stock" value={String(data.laptopStock)}     Icon={Monitor} iconBg="#F3E8FF" iconColor="#7C3AED" />
      <KpiCard label="Components"       value={String(data.componentStock)}  Icon={Cpu}     iconBg="#FFF7ED" iconColor="#F97316" />
    </div>
  )
}

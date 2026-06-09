'use client'

import type { TopConfig } from './analytics-types'

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

interface Props { configs: TopConfig[] }

const RANK_STYLES = [
  { bg: '#FEF3C7', color: '#B45309' },
  { bg: '#F1F5F9', color: '#475569' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F5F2EC', color: '#A1A1AA' },
]

export function TopConfigsTable({ configs }: Props) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0EEE8' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>Top 5 Most Profitable Configurations</h2>
        <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>Ranked by profit margin %</p>
      </div>

      {configs.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', fontSize: 14, color: '#A1A1AA' }}>
          No sales in this period
        </div>
      ) : (
        <div>
          {configs.map((cfg, i) => {
            const rankStyle  = RANK_STYLES[Math.min(i, 3)]
            const marginBg   = cfg.margin >= 20 ? '#D1FAE5' : cfg.margin >= 10 ? '#FFF7ED' : '#F5F2EC'
            const marginColor= cfg.margin >= 20 ? '#047857' : cfg.margin >= 10 ? '#C2410C' : '#A1A1AA'
            return (
              <div key={cfg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #F0EEE8' }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', backgroundColor: rankStyle.bg, color: rankStyle.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.laptopModel}</p>
                  {cfg.components !== '—' && (
                    <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>+ {cfg.components}</p>
                  )}
                  <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>
                    Sell: <span style={{ fontWeight: 500, color: '#3F3F46' }}>{pkr(cfg.sellPrice)}</span>
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, backgroundColor: marginBg, color: marginColor }}>
                    {cfg.margin.toFixed(1)}%
                  </span>
                  <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 4 }}>margin</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

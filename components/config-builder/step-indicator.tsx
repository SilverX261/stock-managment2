import { Check } from 'lucide-react'
import type { ConfigStep } from './types'

const STEPS = [
  { n: 1 as ConfigStep, label: 'Laptop' },
  { n: 2 as ConfigStep, label: 'Components' },
  { n: 3 as ConfigStep, label: 'Review' },
]

export function StepIndicator({ current }: { current: ConfigStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, userSelect: 'none', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {STEPS.map(({ n, label }, idx) => {
        const done   = current > n
        const active = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                backgroundColor: (done || active) ? '#F97316' : '#F5F2EC',
                color: (done || active) ? '#fff' : '#A1A1AA',
                boxShadow: active ? '0 0 0 4px rgba(249,115,22,0.18)' : 'none',
                transition: 'all 200ms',
                flexShrink: 0,
              }}>
                {done ? <Check style={{ width: 14, height: 14 }} /> : n}
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: active ? '#F97316' : '#A1A1AA', whiteSpace: 'normal', wordBreak: 'normal' }}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                height: 2, width: 48, minWidth: 24, margin: '0 4px', marginBottom: 16, flexShrink: 1,
                backgroundColor: current > n ? '#F97316' : '#F0EEE8',
                transition: 'background-color 200ms',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

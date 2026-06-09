import { Check } from 'lucide-react'
import type { ConfigStep } from './types'

const STEPS = [
  { n: 1 as ConfigStep, label: 'Laptop' },
  { n: 2 as ConfigStep, label: 'Components' },
  { n: 3 as ConfigStep, label: 'Review' },
]

export function StepIndicator({ current }: { current: ConfigStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, userSelect: 'none' }}>
      {STEPS.map(({ n, label }, idx) => {
        const done   = current > n
        const active = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                backgroundColor: (done || active) ? '#F97316' : '#F5F2EC',
                color: (done || active) ? '#fff' : '#A1A1AA',
                boxShadow: active ? '0 0 0 4px rgba(249,115,22,0.18)' : 'none',
                transition: 'all 200ms',
              }}>
                {done ? <Check style={{ width: 16, height: 16 }} /> : n}
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: active ? '#F97316' : '#A1A1AA' }}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                height: 2, width: 64, margin: '0 4px', marginBottom: 16,
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

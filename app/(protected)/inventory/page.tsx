'use client'

import { useState } from 'react'
import { LaptopsTab } from '@/components/inventory/laptops-tab'
import { ComponentsTab } from '@/components/inventory/components-tab'
import { Monitor, Cpu } from 'lucide-react'

export default function InventoryPage() {
  const [tab, setTab] = useState<'laptops' | 'components'>('laptops')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Inventory</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3, marginBottom: 16 }}>Manage laptops and components</p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: -1 }}>
          {(['laptops', 'components'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display:        'flex', alignItems: 'center', gap: 6,
                padding:        '8px 16px',
                fontSize:       13, fontWeight: 500,
                borderRadius:   '8px 8px 0 0',
                border:         '1px solid',
                cursor:         'pointer',
                transition:     'background-color 150ms, color 150ms',
                backgroundColor: tab === t ? '#FFFFFF' : 'transparent',
                borderColor:    tab === t ? '#F0EEE8' : 'transparent',
                borderBottom:   tab === t ? '2px solid #F97316' : '1px solid transparent',
                color:          tab === t ? '#0A0A0A' : '#A1A1AA',
              }}
            >
              {t === 'laptops'
                ? <Monitor style={{ width: 14, height: 14 }} />
                : <Cpu     style={{ width: 14, height: 14 }} />}
              {t === 'laptops' ? 'Laptops' : 'Components'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
        {tab === 'laptops' ? <LaptopsTab /> : <ComponentsTab />}
      </div>
    </div>
  )
}

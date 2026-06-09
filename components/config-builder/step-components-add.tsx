'use client'

import { useState } from 'react'
import { Minus, Plus, Cpu, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { pkr } from './types'
import type { Component } from '@/types/database'
import type { SelectedComponent } from './types'

const CAT_COLORS: Record<string, string> = {
  RAM: '#0F766E', SSD: '#047857', HDD: '#3F3F46',
  Charger: '#B45309', Battery: '#B45309',
  Screen: '#0F766E', Keyboard: '#3F3F46', Fan: '#3F3F46', Other: '#3F3F46',
}
const CAT_BGS: Record<string, string> = {
  RAM: '#CCFBF1', SSD: '#D1FAE5', HDD: '#F5F2EC',
  Charger: '#FEF3C7', Battery: '#FEF3C7',
  Screen: '#CCFBF1', Keyboard: '#F5F2EC', Fan: '#F5F2EC', Other: '#F5F2EC',
}

interface Props {
  components: Component[]
  selected: SelectedComponent[]
  onUpdate: (compId: string, qty: number) => void
}

export function StepComponentsAdd({ components, selected, onUpdate }: Props) {
  const [query, setQuery] = useState('')
  const getQty = (id: string) => selected.find(s => s.component.id === id)?.quantity ?? 0

  const filtered = query.trim()
    ? components.filter(c => `${c.category} ${c.name} ${c.specification ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    : components

  const grouped = filtered.reduce<Record<string, Component[]>>((acc, c) => {
    ;(acc[c.category] ??= []).push(c)
    return acc
  }, {})

  const totalAdded    = selected.reduce((s, c) => s + c.quantity, 0)
  const totalAddedSell= selected.reduce((s, c) => s + c.component.sell_price * c.quantity, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {totalAdded > 0 && (
        <div style={{ borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#A1A1AA' }}>{totalAdded} component{totalAdded !== 1 ? 's' : ''} added</span>
          <span style={{ fontWeight: 600, color: '#0A0A0A' }}>+{pkr(totalAddedSell)}</span>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#A1A1AA' }} />
        <Input placeholder="Search components…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 36, height: 44 }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A1A1AA' }}>
          <Cpu style={{ width: 40, height: 40, margin: '0 auto 8px', opacity: 0.4 }} />
          <p style={{ fontSize: 13 }}>No components match your search</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  backgroundColor: CAT_BGS[category] ?? '#F5F2EC',
                  color: CAT_COLORS[category] ?? '#3F3F46',
                }}>
                  {category}
                </span>
                <span style={{ fontSize: 11, color: '#A1A1AA' }}>{items.filter(i => i.quantity > 0).length} in stock</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.sort((a, b) => b.quantity - a.quantity).map(comp => {
                  const qty        = getQty(comp.id)
                  const outOfStock = comp.quantity <= 0
                  const selected_  = qty > 0
                  return (
                    <div key={comp.id} style={{
                      borderRadius: 12, border: '1px solid',
                      borderColor: selected_ ? 'rgba(249,115,22,0.4)' : '#F0EEE8',
                      backgroundColor: selected_ ? 'rgba(249,115,22,0.04)' : outOfStock ? '#FAFAF8' : '#fff',
                      padding: 14,
                      opacity: outOfStock && !selected_ ? 0.5 : 1,
                      transition: 'border-color 150ms, background-color 150ms',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', lineHeight: 1.3 }}>{comp.name}</p>
                          {comp.specification && <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>{comp.specification}</p>}
                          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: '#0A0A0A' }}>{pkr(comp.sell_price)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <button
                            onClick={() => qty > 0 && onUpdate(comp.id, qty - 1)}
                            disabled={qty === 0}
                            style={{
                              width: 36, height: 36, borderRadius: '8px 0 0 8px', border: '1px solid',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: qty === 0 ? 'not-allowed' : 'pointer',
                              borderColor: qty > 0 ? 'rgba(249,115,22,0.3)' : '#F0EEE8',
                              backgroundColor: qty > 0 ? 'rgba(249,115,22,0.08)' : '#F5F2EC',
                              opacity: qty === 0 ? 0.3 : 1,
                            }}
                            aria-label="Remove one"
                          >
                            <Minus style={{ width: 14, height: 14 }} />
                          </button>
                          <div style={{
                            width: 36, height: 36, border: '1px solid', borderLeft: 'none', borderRight: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700,
                            borderColor: qty > 0 ? 'rgba(249,115,22,0.3)' : '#F0EEE8',
                            backgroundColor: qty > 0 ? 'rgba(249,115,22,0.04)' : '#fff',
                            color: qty > 0 ? '#F97316' : '#0A0A0A',
                          }}>
                            {qty}
                          </div>
                          <button
                            onClick={() => !outOfStock && qty < comp.quantity && onUpdate(comp.id, qty + 1)}
                            disabled={outOfStock || qty >= comp.quantity}
                            style={{
                              width: 36, height: 36, borderRadius: '0 8px 8px 0', border: '1px solid',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: outOfStock || qty >= comp.quantity ? 'not-allowed' : 'pointer',
                              borderColor: !outOfStock && qty < comp.quantity ? 'rgba(249,115,22,0.3)' : '#F0EEE8',
                              backgroundColor: !outOfStock && qty < comp.quantity ? 'rgba(249,115,22,0.08)' : '#F5F2EC',
                              opacity: outOfStock || qty >= comp.quantity ? 0.3 : 1,
                            }}
                            aria-label="Add one"
                          >
                            <Plus style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </div>
                      {qty > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(249,115,22,0.2)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A1A1AA' }}>
                          <span>{qty} × {pkr(comp.sell_price)}</span>
                          <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{pkr(comp.sell_price * qty)}</span>
                        </div>
                      )}
                      {outOfStock && <p style={{ marginTop: 6, fontSize: 11, color: '#EF4444' }}>Out of stock</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

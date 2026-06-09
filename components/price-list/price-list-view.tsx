'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, HardDrive, MemoryStick, Monitor, MessageCircle, LayoutGrid, List } from 'lucide-react'
import { withSpecs, makeLaptopFuse } from '@/lib/fuzzy'
import type { Laptop } from '@/types/database'

/* ── Helpers ─────────────────────────────────────────────── */

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`

function storageLabel(gb: number, type: string) {
  return `${gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`} ${type}`
}

function marginInfo(laptop: Laptop): { pct: string; color: string; bg: string } | null {
  if (laptop.sell_price === null || laptop.sell_price === 0) return null
  const pct = ((laptop.sell_price - laptop.cost_price) / laptop.sell_price) * 100
  if (pct >= 20) return { pct: pct.toFixed(1), color: '#047857', bg: '#D1FAE5' }
  if (pct >= 10) return { pct: pct.toFixed(1), color: '#B45309', bg: '#FEF3C7' }
  if (pct >= 0)  return { pct: pct.toFixed(1), color: '#EA580C', bg: '#FFF7ED' }
  return { pct: pct.toFixed(1), color: '#B91C1C', bg: '#FEE2E2' }
}

const COND_BADGE: Record<string, { bg: string; color: string }> = {
  new:         { bg: '#D1FAE5', color: '#047857' },
  used:        { bg: '#FEF3C7', color: '#B45309' },
  refurbished: { bg: '#CCFBF1', color: '#0F766E' },
}

function buildCatalogMessage(laptops: Laptop[]): string {
  const inStock = laptops.filter(l => l.quantity > 0 && l.sell_price !== null)
  const fmt = (n: number) => n.toLocaleString('en-PK')
  const date = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const brands = Array.from(new Set(inStock.map(l => l.brand))).sort()
  const lines: string[] = [
    '*Fine Computers* 🖥️', '*📦 Available Stock*', 'Trust Plaza, Sargodha', `📅 ${date}`, '',
    '━━━━━━━━━━━━━━━━━━━━', '',
  ]
  for (const brand of brands) {
    const group = inStock.filter(l => l.brand === brand)
    lines.push(`*${brand.toUpperCase()}*`)
    for (const l of group) {
      const specs = [
        l.processor ? l.processor.replace(/Intel Core |AMD /gi, '') : null,
        `${l.base_ram_gb}GB RAM`,
        storageLabel(l.base_storage_gb, l.storage_type),
        l.display_size ? `${l.display_size}"` : null,
      ].filter(Boolean).join(', ')
      const qty = l.quantity > 1 ? ` (${l.quantity} in stock)` : ''
      lines.push(`• ${l.model}${qty} · ${specs} — *PKR ${fmt(l.sell_price!)}*`)
    }
    lines.push('')
  }
  lines.push('━━━━━━━━━━━━━━━━━━━━', `📦 *Total: ${inStock.length} laptop${inStock.length !== 1 ? 's' : ''} available*`, '', '💬 Message us to book your laptop!', 'Fine Computers | Trust Plaza, Sargodha')
  return lines.join('\n')
}

type ViewMode = 'table' | 'cards'

/* ── Card Component ──────────────────────────────────────── */

function LaptopCard({ laptop }: { laptop: Laptop }) {
  const mg   = marginInfo(laptop)
  const cond = COND_BADGE[laptop.condition] ?? { bg: '#F5F2EC', color: '#3F3F46' }
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F0EEE8',
        borderRadius: 16,
        padding: 20,
        boxShadow: hovered
          ? '0 6px 20px rgba(0,0,0,0.10)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'box-shadow 150ms',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.3, marginBottom: 3 }}>
            {laptop.brand} {laptop.model}
          </h3>
          {laptop.processor && (
            <p style={{ fontSize: 12, color: '#A1A1AA', lineHeight: 1.4 }}>{laptop.processor}</p>
          )}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '2px 8px', borderRadius: 99,
          fontSize: 10, fontWeight: 600,
          backgroundColor: cond.bg, color: cond.color,
          flexShrink: 0, textTransform: 'capitalize',
        }}>
          {laptop.condition}
        </span>
      </div>

      {/* Spec chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          backgroundColor: '#F5F2EC', padding: '4px 8px', borderRadius: 6,
          fontSize: 11, color: '#3F3F46',
        }}>
          <MemoryStick style={{ width: 11, height: 11 }} />
          {laptop.base_ram_gb}GB RAM
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          backgroundColor: '#F5F2EC', padding: '4px 8px', borderRadius: 6,
          fontSize: 11, color: '#3F3F46',
        }}>
          <HardDrive style={{ width: 11, height: 11 }} />
          {storageLabel(laptop.base_storage_gb, laptop.storage_type)}
        </span>
        {laptop.display_size && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            backgroundColor: '#F5F2EC', padding: '4px 8px', borderRadius: 6,
            fontSize: 11, color: '#3F3F46',
          }}>
            <Monitor style={{ width: 11, height: 11 }} />
            {laptop.display_size}&quot;
          </span>
        )}
        {laptop.quantity > 1 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            backgroundColor: '#F5F2EC', padding: '4px 8px', borderRadius: 6,
            fontSize: 11, color: '#A1A1AA',
          }}>
            {laptop.quantity} in stock
          </span>
        )}
      </div>

      {/* Price section */}
      <div style={{ borderTop: '1px solid #F0EEE8', paddingTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 3 }}>Sell Price</p>
          {laptop.sell_price !== null ? (
            <p style={{ fontSize: 22, fontWeight: 700, color: '#F97316', lineHeight: 1 }}>
              {pkr(laptop.sell_price)}
            </p>
          ) : (
            <p style={{ fontSize: 14, fontWeight: 600, color: '#A1A1AA', fontStyle: 'italic' }}>Price TBD</p>
          )}
          <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 4 }}>
            Cost: {pkr(laptop.cost_price)}
          </p>
        </div>
        {mg && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 10px', borderRadius: 99,
            fontSize: 12, fontWeight: 700,
            backgroundColor: mg.bg, color: mg.color,
          }}>
            {mg.pct}%
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Table Component ─────────────────────────────────────── */

function LaptopTable({ laptops }: { laptops: Laptop[] }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #F0EEE8',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F7F4' }}>
              {['Brand / Model', 'Specs', 'Condition', 'Sell Price', 'Cost Price', 'Margin', 'Stock'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontWeight: 600, fontSize: 12, color: '#A1A1AA',
                  whiteSpace: 'nowrap', borderBottom: '1px solid #F0EEE8',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {laptops.map((laptop, idx) => {
              const mg   = marginInfo(laptop)
              const cond = COND_BADGE[laptop.condition] ?? { bg: '#F5F2EC', color: '#3F3F46' }
              return (
                <tr
                  key={laptop.id}
                  style={{
                    borderBottom: idx < laptops.length - 1 ? '1px solid #F0EEE8' : 'none',
                    transition: 'background-color 100ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FAFAF8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '' }}
                >
                  {/* Brand / Model */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    <p style={{ fontWeight: 700, color: '#0A0A0A', whiteSpace: 'nowrap' }}>
                      {laptop.brand} {laptop.model}
                    </p>
                    {laptop.processor && (
                      <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {laptop.processor}
                      </p>
                    )}
                  </td>

                  {/* Specs */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#3F3F46' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MemoryStick style={{ width: 11, height: 11, color: '#A1A1AA' }} />
                        {laptop.base_ram_gb}GB
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <HardDrive style={{ width: 11, height: 11, color: '#A1A1AA' }} />
                        {storageLabel(laptop.base_storage_gb, laptop.storage_type)}
                      </span>
                      {laptop.display_size && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Monitor style={{ width: 11, height: 11, color: '#A1A1AA' }} />
                          {laptop.display_size}&quot;
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Condition */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 99,
                      fontSize: 11, fontWeight: 600,
                      backgroundColor: cond.bg, color: cond.color,
                      textTransform: 'capitalize',
                    }}>
                      {laptop.condition}
                    </span>
                  </td>

                  {/* Sell Price */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {laptop.sell_price !== null ? (
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#F97316' }}>
                        {pkr(laptop.sell_price)}
                      </span>
                    ) : (
                      <span style={{ color: '#A1A1AA', fontStyle: 'italic', fontSize: 12 }}>Price TBD</span>
                    )}
                  </td>

                  {/* Cost Price */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#A1A1AA' }}>
                    {pkr(laptop.cost_price)}
                  </td>

                  {/* Margin */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    {mg ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 8px', borderRadius: 99,
                        fontSize: 12, fontWeight: 700,
                        backgroundColor: mg.bg, color: mg.color,
                      }}>
                        {mg.pct}%
                      </span>
                    ) : (
                      <span style={{ color: '#A1A1AA' }}>—</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle', color: laptop.quantity <= 1 ? '#B91C1C' : '#3F3F46', fontWeight: laptop.quantity <= 1 ? 600 : 400 }}>
                    {laptop.quantity}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Main View ───────────────────────────────────────────── */

export function PriceListView() {
  const supabase = useMemo(() => createClient(), [])
  const [laptops,  setLaptops]  = useState<Laptop[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [inputFocused, setInputFocused] = useState(false)

  const fetchLaptops = useCallback(async () => {
    const { data } = await supabase.from('laptops').select('*').order('brand').order('model')
    setLaptops(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLaptops() }, [fetchLaptops])

  useEffect(() => {
    const ch = supabase
      .channel('price-list-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'laptops' }, fetchLaptops)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, fetchLaptops])

  const searchItems = useMemo(() => laptops.map(withSpecs), [laptops])
  const fuse        = useMemo(() => makeLaptopFuse(searchItems), [searchItems])
  const filtered    = useMemo(() => {
    if (!query.trim()) return laptops
    return fuse.search(query).map(r => r.item)
  }, [fuse, laptops, query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Toolbar ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, width: '100%' }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 15, height: 15, color: '#A1A1AA',
          }} />
          <input
            type="text"
            placeholder="Search by brand, model or processor…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              width: '100%',
              border: `1px solid ${inputFocused ? '#F97316' : '#E4E2DC'}`,
              borderRadius: 8,
              padding: '10px 16px 10px 36px',
              fontSize: 14,
              color: '#0A0A0A',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              boxShadow: inputFocused ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
          />
        </div>

        {/* WhatsApp Catalog */}
        <button
          onClick={() => {
            const msg = buildCatalogMessage(laptops)
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 8,
            backgroundColor: '#FFFFFF', border: '1px solid rgba(37,211,102,0.4)',
            color: '#25D366', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(37,211,102,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF' }}
        >
          <MessageCircle style={{ width: 16, height: 16 }} />
          WhatsApp Catalog
        </button>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid #E4E2DC', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          {(['table', 'cards'] as ViewMode[]).map((mode, i) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: 'none',
                borderLeft: i > 0 ? '1px solid #E4E2DC' : 'none',
                backgroundColor: viewMode === mode ? '#F97316' : '#FFFFFF',
                color: viewMode === mode ? '#FFFFFF' : '#A1A1AA',
                transition: 'background-color 120ms, color 120ms',
              }}
              onMouseEnter={e => { if (viewMode !== mode) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAF8' }}
              onMouseLeave={e => { if (viewMode !== mode) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF' }}
            >
              {mode === 'table'
                ? <><List style={{ width: 15, height: 15 }} />Table</>
                : <><LayoutGrid style={{ width: 15, height: 15 }} />Cards</>
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── Count label ──────────────────────────────── */}
      {!loading && (
        <p style={{ fontSize: 12, color: '#A1A1AA' }}>
          {filtered.length} laptop{filtered.length !== 1 ? 's' : ''}
          {query.trim() ? ` matching "${query.trim()}"` : ' in inventory'}
        </p>
      )}

      {/* ── Content ──────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
          <div className="fc-spin" style={{ width: 28, height: 28, border: '3px solid #F0EEE8', borderTopColor: '#F97316', borderRadius: '50%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12, textAlign: 'center' }}>
          <Monitor style={{ width: 48, height: 48, color: '#E4E2DC' }} />
          <p style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 15 }}>
            {query.trim() ? 'No laptops match your search' : 'No laptops in inventory'}
          </p>
          {query.trim() && <p style={{ fontSize: 13, color: '#A1A1AA' }}>No results found — try a different search term</p>}
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 16,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {filtered.map(l => <LaptopCard key={l.id} laptop={l} />)}
        </div>
      ) : (
        <LaptopTable laptops={filtered} />
      )}
    </div>
  )
}

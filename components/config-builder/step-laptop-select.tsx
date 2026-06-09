'use client'

import { useState, useMemo } from 'react'
import { Check, Monitor, HardDrive, MemoryStick, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { pkr } from './types'
import { withSpecs, makeLaptopFuse, matchIndices, hl, type FuseMatch } from '@/lib/fuzzy'
import type { Laptop } from '@/types/database'

const COND_COLORS: Record<string, { bg: string; text: string }> = {
  new:         { bg: '#D1FAE5', text: '#047857' },
  used:        { bg: '#FEF3C7', text: '#B45309' },
  refurbished: { bg: '#CCFBF1', text: '#0F766E' },
}
function storageLabel(gb: number) { return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB` }

interface Props {
  laptops: Laptop[]
  selected: Laptop | null
  onSelect: (l: Laptop) => void
}

export function StepLaptopSelect({ laptops, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')

  // Enrich with _specs so "8gb" / "256ssd" queries resolve correctly
  const searchItems = useMemo(() => laptops.map(withSpecs), [laptops])

  // Fuse instance — only rebuilt when laptops list changes
  const fuse = useMemo(() => makeLaptopFuse(searchItems), [searchItems])

  // Search results with match positions for highlighting
  const results = useMemo(() => {
    if (!query.trim())
      return searchItems.map(item => ({ item, matches: [] as readonly FuseMatch[] }))
    return fuse.search(query).map(r => ({ item: r.item, matches: r.matches ?? [] }))
  }, [fuse, searchItems, query])

  const inStock    = results.filter(r => r.item.quantity > 0)
  const outOfStock = results.filter(r => r.item.quantity <= 0)

  function LaptopCard({
    item: laptop,
    matches,
  }: {
    item: Laptop & { _specs?: string }
    matches: readonly FuseMatch[]
  }) {
    const isSelected = selected?.id === laptop.id
    const disabled   = laptop.quantity <= 0
    const cond       = COND_COLORS[laptop.condition] ?? { bg: '#F5F2EC', text: '#3F3F46' }

    const brandIdx = matchIndices(matches, 'brand')
    const modelIdx = matchIndices(matches, 'model')
    const procIdx  = matchIndices(matches, 'processor')

    return (
      <button
        onClick={() => !disabled && onSelect(laptop)}
        disabled={disabled}
        style={{
          width: '100%', textAlign: 'left', borderRadius: 12, border: '1px solid',
          borderColor: isSelected ? '#F97316' : '#F0EEE8',
          backgroundColor: isSelected ? 'rgba(249,115,22,0.03)' : disabled ? '#FAFAF8' : '#fff',
          padding: 16, cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          boxShadow: isSelected ? '0 0 0 3px rgba(249,115,22,0.18)' : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
          outline: 'none',
        }}
        aria-pressed={isSelected}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>
                {hl(laptop.brand, brandIdx)} {hl(laptop.model, modelIdx)}
              </span>
              <span style={{ ...cond, display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                {laptop.condition}
              </span>
              {disabled && <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Out of stock</span>}
            </div>
            {laptop.processor && (
              <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 6 }}>
                {hl(laptop.processor, procIdx)}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 11, color: '#A1A1AA' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MemoryStick style={{ width: 11, height: 11 }} />{laptop.base_ram_gb} GB RAM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <HardDrive style={{ width: 11, height: 11 }} />{storageLabel(laptop.base_storage_gb)} {laptop.storage_type}
              </span>
              {laptop.display_size && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Monitor style={{ width: 11, height: 11 }} />{laptop.display_size}&quot;
              </span>}
              <span style={{ opacity: 0.5 }}>Qty: {laptop.quantity}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A' }}>
              {laptop.sell_price !== null ? pkr(laptop.sell_price) : 'Price TBD'}
            </span>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', border: '2px solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderColor: isSelected ? '#F97316' : 'rgba(161,161,170,0.3)',
              backgroundColor: isSelected ? '#F97316' : 'transparent',
              transition: 'all 150ms',
            }}>
              {isSelected && <Check style={{ width: 14, height: 14, color: '#fff' }} />}
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#A1A1AA' }} />
        <Input
          placeholder="Search brand, model, processor, RAM, storage…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ paddingLeft: 36, height: 44 }}
        />
      </div>

      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A1A1AA' }}>
          <Monitor style={{ width: 40, height: 40, margin: '0 auto 8px', opacity: 0.4 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#3F3F46' }}>
            {laptops.length === 0 ? 'No laptops in inventory yet' : 'No results found'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            {laptops.length === 0
              ? 'Add laptops in the Inventory page first'
              : 'Try a different search term'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {inStock.map(r => <LaptopCard key={r.item.id} item={r.item} matches={r.matches} />)}
          {outOfStock.length > 0 && (
            <>
              <p style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 500, padding: '4px 0' }}>Out of stock</p>
              {outOfStock.map(r => <LaptopCard key={r.item.id} item={r.item} matches={r.matches} />)}
            </>
          )}
        </div>
      )}
    </div>
  )
}

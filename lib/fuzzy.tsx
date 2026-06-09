import { type ReactNode } from 'react'
import Fuse from 'fuse.js'
import type { FuseResultMatch, FuseOptionKey } from 'fuse.js'

export type FuseMatch = FuseResultMatch

/** Prepend a _specs string to a laptop so "8gb" / "256ssd" queries work */
export function withSpecs<T extends {
  base_ram_gb: number; base_storage_gb: number; storage_type: string
}>(item: T): T & { _specs: string } {
  return {
    ...item,
    _specs: `${item.base_ram_gb}GB ${item.base_ram_gb}gb ${item.base_storage_gb}GB ${item.base_storage_gb}gb ${item.storage_type}`,
  }
}

/** Fuse instance pre-configured for laptop search (brand, model, processor, RAM/storage specs) */
export function makeLaptopFuse<T extends {
  brand: string; model: string; processor?: string | null; _specs?: string; condition?: string
}>(items: T[]) {
  return new Fuse(items, {
    keys: [
      { name: 'brand',     weight: 3 },
      { name: 'model',     weight: 3 },
      { name: 'processor', weight: 2 },
      { name: '_specs',    weight: 1.5 },
      { name: 'condition', weight: 0.5 },
    ],
    threshold:          0.35,
    includeScore:       true,
    includeMatches:     true,
    ignoreLocation:     true,
    minMatchCharLength: 1,
  })
}

/** Generic Fuse instance for any type and key list */
export function makeFuse<T>(items: T[], keys: FuseOptionKey<T>[]) {
  return new Fuse(items, {
    keys,
    threshold:          0.3,
    includeScore:       true,
    includeMatches:     true,
    ignoreLocation:     true,
    minMatchCharLength: 1,
  })
}

/** Pull the matched character ranges for a given key out of a Fuse match set */
export function matchIndices(
  matches: readonly FuseResultMatch[] | undefined,
  key: string,
): ReadonlyArray<readonly [number, number]> | undefined {
  return matches?.find(m => m.key === key)?.indices as
    ReadonlyArray<readonly [number, number]> | undefined
}

/** Wrap matched character positions in orange — returns React nodes */
export function hl(
  text: string,
  indices: ReadonlyArray<readonly [number, number]> | undefined,
): ReactNode {
  if (!indices?.length) return text
  const sorted = [...indices].sort((a, b) => a[0] - b[0])
  const parts: ReactNode[] = []
  let last = 0
  for (const [s, e] of sorted) {
    if (s > last) parts.push(text.slice(last, s))
    parts.push(
      <mark key={s} style={{ background: 'none', color: '#F97316', fontWeight: 700 }}>
        {text.slice(s, e + 1)}
      </mark>
    )
    last = e + 1
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

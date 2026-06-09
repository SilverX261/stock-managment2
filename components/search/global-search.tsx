'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Search, Monitor, Users, ShoppingCart, X, Loader2, ArrowRight } from 'lucide-react'
import Fuse from 'fuse.js'
import type { FuseResultMatch } from 'fuse.js'
import { matchIndices, hl } from '@/lib/fuzzy'

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

interface LaptopHit {
  id: string; brand: string; model: string
  processor: string | null; sell_price: number | null
  quantity: number; serial_number: string | null
}

interface CustomerHit {
  id: string; name: string; phone: string | null
}

interface SaleHit {
  id: string; sale_date: string; total_sell_price: number
  customer: { id: string; name: string } | null
  sale_items: Array<{ laptop: { brand: string; model: string } | null }>
  _text?: string
}

interface Results {
  laptops:   Array<{ item: LaptopHit;   matches: readonly FuseResultMatch[] }>
  customers: Array<{ item: CustomerHit; matches: readonly FuseResultMatch[] }>
  sales:     SaleHit[]
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const inputRef = useRef<HTMLInputElement>(null)

  const [query,        setQuery]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [allLaptops,   setAllLaptops]   = useState<LaptopHit[]>([])
  const [allCustomers, setAllCustomers] = useState<CustomerHit[]>([])
  const [allSales,     setAllSales]     = useState<SaleHit[]>([])
  const [dataLoaded,   setDataLoaded]   = useState(false)

  const debouncedQuery = useDebounce(query, 150)

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Escape closes
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  // Preload all data once when modal first opens
  useEffect(() => {
    if (!open || dataLoaded) return
    setLoading(true)
    async function preload() {
      const [lr, cr, sr] = await Promise.all([
        supabase
          .from('laptops')
          .select('id, brand, model, processor, sell_price, quantity, serial_number')
          .order('brand'),
        supabase
          .from('customers')
          .select('id, name, phone')
          .order('name'),
        supabase
          .from('sales')
          .select('id, sale_date, total_sell_price, customer:customers(id,name), sale_items(laptop:laptops(brand,model))')
          .order('sale_date', { ascending: false })
          .limit(300),
      ])
      setAllLaptops((lr.data ?? []) as LaptopHit[])
      setAllCustomers((cr.data ?? []) as CustomerHit[])
      setAllSales(
        ((sr.data ?? []) as unknown as SaleHit[]).map(s => ({
          ...s,
          _text: [
            s.customer?.name ?? '',
            ...(s.sale_items?.map(si =>
              si.laptop ? `${si.laptop.brand} ${si.laptop.model}` : ''
            ) ?? []),
            s.sale_date,
          ].join(' '),
        }))
      )
      setDataLoaded(true)
      setLoading(false)
    }
    preload()
  }, [open, dataLoaded, supabase])

  // Fuse instances — only recreated when the underlying data changes
  const laptopFuse = useMemo(
    () => new Fuse(allLaptops, {
      keys: [
        { name: 'brand',         weight: 3 },
        { name: 'model',         weight: 3 },
        { name: 'processor',     weight: 2 },
        { name: 'serial_number', weight: 2 },
      ],
      threshold: 0.35, includeMatches: true, ignoreLocation: true, minMatchCharLength: 1,
    }),
    [allLaptops]
  )

  const custFuse = useMemo(
    () => new Fuse(allCustomers, {
      keys: [{ name: 'name', weight: 2 }, { name: 'phone', weight: 1 }],
      threshold: 0.3, includeMatches: true, ignoreLocation: true, minMatchCharLength: 1,
    }),
    [allCustomers]
  )

  const saleFuse = useMemo(
    () => new Fuse(allSales, {
      keys: [{ name: '_text', weight: 1 }],
      threshold: 0.3, ignoreLocation: true, minMatchCharLength: 1,
    }),
    [allSales]
  )

  // Apply Fuse.js synchronously on every debounced query change
  const results = useMemo<Results | null>(() => {
    const q = debouncedQuery.trim()
    if (!q) return null
    return {
      laptops:   laptopFuse.search(q).slice(0, 5).map(r => ({ item: r.item, matches: r.matches ?? [] })),
      customers: custFuse.search(q).slice(0, 5).map(r => ({ item: r.item, matches: r.matches ?? [] })),
      sales:     saleFuse.search(q).slice(0, 5).map(r => r.item),
    }
  }, [debouncedQuery, laptopFuse, custFuse, saleFuse])

  function go(path: string) {
    router.push(path); onClose()
  }

  if (!open) return null

  const hasResults = !!results && (
    results.laptops.length + results.customers.length + results.sales.length > 0
  )
  const showEmpty = !!results && !hasResults && debouncedQuery.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl flex flex-col overflow-hidden"
        style={{
          maxHeight: '72vh',
          backgroundColor: '#FFFFFF',
          border: '1px solid #F0EEE8',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
        }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0">
          {loading
            ? <Loader2 className="w-4 h-4 shrink-0 text-muted-foreground animate-spin" />
            : <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search laptops, customers, sales…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[11px] text-muted-foreground border rounded px-1.5 py-0.5 shrink-0 font-sans">
            Esc
          </kbd>
        </div>

        {/* Results body */}
        <div className="overflow-y-auto flex-1">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-sm">Search inventory, customers, and sales</p>
              <p className="text-xs opacity-60">Fuzzy search — typos OK · Results appear as you type</p>
            </div>
          )}

          {showEmpty && (
            <div className="py-14 text-center text-sm text-muted-foreground">
              No results found —{' '}
              <span className="font-medium text-foreground">try a different search term</span>
            </div>
          )}

          {hasResults && (
            <div>
              {/* Laptops */}
              {results!.laptops.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                    <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Laptops
                    </span>
                  </div>
                  {results!.laptops.map(({ item: l, matches }) => (
                    <button
                      key={l.id}
                      onClick={() => go('/inventory')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {hl(l.brand, matchIndices(matches, 'brand'))}{' '}
                          {hl(l.model, matchIndices(matches, 'model'))}
                        </p>
                        {l.processor && (
                          <p className="text-xs text-muted-foreground truncate">
                            {hl(l.processor, matchIndices(matches, 'processor'))}
                          </p>
                        )}
                        {l.serial_number && (
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            SN: {hl(l.serial_number, matchIndices(matches, 'serial_number'))}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 text-xs space-y-0.5">
                        {l.sell_price != null && (
                          <p className="font-medium">{pkr(l.sell_price)}</p>
                        )}
                        <p className="text-muted-foreground">Qty: {l.quantity}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Customers */}
              {results!.customers.length > 0 && (
                <section className={results!.laptops.length > 0 ? 'border-t' : ''}>
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Customers
                    </span>
                  </div>
                  {results!.customers.map(({ item: c, matches }) => (
                    <button
                      key={c.id}
                      onClick={() => go(`/customers/${c.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {hl(c.name, matchIndices(matches, 'name'))}
                        </p>
                        {c.phone && (
                          <p className="text-xs text-muted-foreground">
                            {hl(c.phone, matchIndices(matches, 'phone'))}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </section>
              )}

              {/* Sales */}
              {results!.sales.length > 0 && (
                <section
                  className={
                    results!.laptops.length > 0 || results!.customers.length > 0
                      ? 'border-t'
                      : ''
                  }
                >
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sales
                    </span>
                  </div>
                  {results!.sales.map(s => {
                    const laptopItem = s.sale_items?.find(si => si.laptop)
                    return (
                      <button
                        key={s.id}
                        onClick={() => go('/sales')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.customer?.name ?? 'Walk-in customer'}
                            {laptopItem?.laptop && (
                              <span className="font-normal text-muted-foreground">
                                {' — '}
                                {laptopItem.laptop.brand} {laptopItem.laptop.model}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.sale_date).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="text-xs font-medium shrink-0">{pkr(s.total_sell_price)}</p>
                      </button>
                    )
                  })}
                </section>
              )}

              <div className="h-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

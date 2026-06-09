'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Trash2, Monitor, Cpu, Loader2, Search, UserPlus, User, UserX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormItem, PaymentType } from './types'
import { WARRANTY_OPTIONS, warrantyExpiry } from './types'
import type { Laptop, Component, Customer } from '@/types/database'

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

type CustomerMode = 'none' | 'existing' | 'new'

export function SaleForm({ open, onOpenChange, onCreated }: Props) {
  const supabase = useMemo(() => createClient(), [])

  // Inventory data
  const [laptops, setLaptops] = useState<Laptop[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Form state
  const [items, setItems] = useState<FormItem[]>([])
  const [customerMode, setCustomerMode] = useState<CustomerMode>('none')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerDropOpen, setCustomerDropOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [warrantyDays, setWarrantyDays] = useState(0)
  const [specsPromised, setSpecsPromised] = useState('')

  // Laptop/component picker state
  const [showLaptopPicker, setShowLaptopPicker] = useState(false)
  const [showCompPicker, setShowCompPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const custRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      const [lr, cr, csr] = await Promise.all([
        supabase.from('laptops').select('*').order('brand'),
        supabase.from('components').select('*').order('category').order('name'),
        supabase.from('customers').select('*').order('name'),
      ])
      setLaptops(lr.data ?? [])
      setComponents(cr.data ?? [])
      setCustomers(csr.data ?? [])
      setDataLoaded(true)
    }
    load()
  }, [open, supabase])

  // Reset when closed
  function handleOpenChange(v: boolean) {
    if (!v) {
      setItems([]); setCustomerMode('none'); setSelectedCustomer(null)
      setCustomerSearch(''); setNewName(''); setNewPhone('')
      setPaymentType('cash'); setNotes(''); setError(null)
      setShowLaptopPicker(false); setShowCompPicker(false); setPickerSearch('')
      setSaleDate(new Date().toISOString().split('T')[0])
      setWarrantyDays(0); setSpecsPromised('')
    }
    onOpenChange(v)
  }

  // Close customer dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (custRef.current && !custRef.current.contains(e.target as Node)) {
        setCustomerDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function addLaptop(laptop: Laptop) {
    setItems(prev => [...prev, {
      type: 'laptop', id: laptop.id,
      name: `${laptop.brand} ${laptop.model}`,
      quantity: 1, costPrice: laptop.cost_price, sellPrice: laptop.sell_price ?? 0,
      stockQty: laptop.quantity,
      serialNumber: laptop.serial_number ?? null,
    }])
    setShowLaptopPicker(false); setPickerSearch('')
  }

  function addComponent(comp: Component) {
    setItems(prev => {
      const existing = prev.find(i => i.type === 'component' && i.id === comp.id)
      if (existing) return prev.map(i =>
        i.type === 'component' && i.id === comp.id
          ? { ...i, quantity: i.quantity + 1 } : i
      )
      return [...prev, {
        type: 'component', id: comp.id,
        name: comp.specification ? `${comp.name} (${comp.specification})` : comp.name,
        quantity: 1, costPrice: comp.cost_price, sellPrice: comp.sell_price,
      }]
    })
    setShowCompPicker(false); setPickerSearch('')
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: 'quantity' | 'sellPrice', val: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  const totalCost = items.reduce((s, i) => s + i.costPrice * i.quantity, 0)
  const totalSell = items.reduce((s, i) => s + i.sellPrice * i.quantity, 0)
  const profit = totalSell - totalCost
  const margin = totalSell > 0 ? ((profit / totalSell) * 100).toFixed(1) : '0'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) { setError('Add at least one item.'); return }
    if (customerMode === 'new' && !newName.trim()) { setError('Customer name is required.'); return }

    setSaving(true); setError(null)
    try {
      // 1. Create customer if needed
      let customerId: string | null = selectedCustomer?.id ?? null
      if (customerMode === 'new') {
        const { data, error: cErr } = await supabase
          .from('customers')
          .insert({ name: newName.trim(), phone: newPhone.trim() || null })
          .select('id').single()
        if (cErr) throw cErr
        customerId = data.id
      }

      // 2. Create sale
      const laptopSerial = items.find(i => i.type === 'laptop')?.serialNumber ?? null
      const { data: sale, error: sErr } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId,
          sale_date: saleDate,
          total_cost_price: totalCost,
          total_sell_price: totalSell,
          payment_type: paymentType,
          notes: notes.trim() || null,
          warranty_days: warrantyDays,
          specs_promised: specsPromised.trim() || null,
          serial_number: laptopSerial,
        })
        .select('id').single()
      if (sErr) throw sErr

      // 3. Create sale_items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        item_type: item.type,
        laptop_id: item.type === 'laptop' ? item.id : null,
        component_id: item.type === 'component' ? item.id : null,
        quantity: item.quantity,
        cost_price_snapshot: item.costPrice,
        sell_price_snapshot: item.sellPrice,
      }))
      const { error: siErr } = await supabase.from('sale_items').insert(saleItems)
      if (siErr) throw siErr

      // 4. Decrement inventory (all in parallel)
      for (const item of items) {
        if (item.type === 'laptop') {
          const laptop = laptops.find(l => l.id === item.id)
          if (laptop) {
            await supabase.from('laptops')
              .update({ quantity: Math.max(0, laptop.quantity - item.quantity) })
              .eq('id', item.id)
          }
        } else {
          const comp = components.find(c => c.id === item.id)
          if (comp) {
            await supabase.from('components')
              .update({ quantity: Math.max(0, comp.quantity - item.quantity) })
              .eq('id', item.id)
          }
        }
      }

      onCreated()
      handleOpenChange(false)
    } catch (err) {
      console.error('Create sale error:', err)
      setError((err as { message?: string })?.message ?? 'Failed to create sale.')
    } finally {
      setSaving(false)
    }
  }

  const filteredCustomers = customers.filter(c =>
    `${c.name} ${c.phone ?? ''}`.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredLaptops = laptops.filter(l =>
    `${l.brand} ${l.model}`.toLowerCase().includes(pickerSearch.toLowerCase())
  ).filter(l => l.quantity > 0 || pickerSearch)

  const filteredComponents = components.filter(c =>
    `${c.category} ${c.name} ${c.specification ?? ''}`.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>

        {!dataLoaded ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">

            {/* ── Items section ──────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Items</Label>
                <div className="flex gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs"
                    onClick={() => { setShowLaptopPicker(p => !p); setShowCompPicker(false); setPickerSearch('') }}>
                    <Monitor className="w-3.5 h-3.5" /> Laptop
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs"
                    onClick={() => { setShowCompPicker(p => !p); setShowLaptopPicker(false); setPickerSearch('') }}>
                    <Cpu className="w-3.5 h-3.5" /> Component
                  </Button>
                </div>
              </div>

              {/* Laptop picker */}
              {showLaptopPicker && (
                <div className="rounded-lg border bg-muted/30 p-2.5 mb-2 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="h-8 pl-7 text-sm" placeholder="Search laptops…"
                      value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {filteredLaptops.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No laptops found</p>
                    )}
                    {filteredLaptops.map(l => (
                      <button key={l.id} type="button" onClick={() => addLaptop(l)}
                        className="w-full text-left rounded-md px-2.5 py-2 hover:bg-accent text-sm flex justify-between">
                        <span>{l.brand} {l.model}</span>
                        <span className="text-xs text-muted-foreground">{l.quantity} in stock</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Component picker */}
              {showCompPicker && (
                <div className="rounded-lg border bg-muted/30 p-2.5 mb-2 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="h-8 pl-7 text-sm" placeholder="Search components…"
                      value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {filteredComponents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No components found</p>
                    )}
                    {filteredComponents.map(c => (
                      <button key={c.id} type="button" onClick={() => addComponent(c)}
                        className="w-full text-left rounded-md px-2.5 py-2 hover:bg-accent text-sm flex justify-between items-center">
                        <span>
                          <Badge variant="secondary" className="text-xs mr-1.5">{c.category}</Badge>
                          {c.name}
                          {c.specification && <span className="text-muted-foreground text-xs ml-1">{c.specification}</span>}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">{c.quantity} stock</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Added items */}
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 rounded-lg border border-dashed">
                  No items yet — add a laptop or component above
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-lg border bg-card p-2.5">
                      <div className="flex items-center gap-2 mb-2">
                        {item.type === 'laptop'
                          ? <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          : <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        }
                        <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
                        <button type="button" onClick={() => removeItem(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Qty</Label>
                          <Input
                            type="number" min={1}
                            max={item.type === 'laptop' && item.stockQty ? item.stockQty : undefined}
                            className="h-8 text-sm mt-0.5"
                            value={item.quantity}
                            onChange={e => {
                              const max = item.type === 'laptop' && item.stockQty
                                ? item.stockQty : Infinity
                              updateItem(idx, 'quantity', Math.max(1, Math.min(max, Number(e.target.value))))
                            }}
                          />
                          {item.type === 'laptop' && item.stockQty !== undefined && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.stockQty} in stock</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Cost (PKR)</Label>
                          <Input type="number" min={0} className="h-8 text-sm mt-0.5 bg-muted/50"
                            value={item.costPrice} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Sell (PKR)</Label>
                          <Input type="number" min={0} className="h-8 text-sm mt-0.5"
                            value={item.sellPrice}
                            onChange={e => updateItem(idx, 'sellPrice', Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* ── Customer section ───────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Customer</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['none', 'existing', 'new'] as CustomerMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setCustomerMode(mode); setSelectedCustomer(null); setCustomerSearch('') }}
                    className={cn(
                      'h-9 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                      customerMode === mode
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-[#FAFAF8]'
                    )}
                  >
                    {mode === 'none' && <><UserX className="w-3.5 h-3.5" /> Walk-in</>}
                    {mode === 'existing' && <><User className="w-3.5 h-3.5" /> Existing</>}
                    {mode === 'new' && <><UserPlus className="w-3.5 h-3.5" /> New</>}
                  </button>
                ))}
              </div>

              {customerMode === 'existing' && (
                <div ref={custRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-11"
                      placeholder="Search by name or phone…"
                      value={selectedCustomer ? selectedCustomer.name : customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value)
                        setSelectedCustomer(null)
                        setCustomerDropOpen(true)
                      }}
                      onFocus={() => setCustomerDropOpen(true)}
                    />
                  </div>
                  {customerDropOpen && !selectedCustomer && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg max-h-48 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No customers found</p>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setCustomerDropOpen(false) }}
                          >
                            <div className="text-sm font-medium">{c.name}</div>
                            {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {selectedCustomer && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-emerald-600">
                      <User className="w-3.5 h-3.5" />
                      {selectedCustomer.name}
                      {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
                    </div>
                  )}
                </div>
              )}

              {customerMode === 'new' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="new-cust-name">Name *</Label>
                    <Input id="new-cust-name" className="h-10" placeholder="Customer name"
                      value={newName} onChange={e => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="new-cust-phone">Phone</Label>
                    <Input id="new-cust-phone" className="h-10" placeholder="0300-1234567"
                      value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* ── Details section ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sale-date" className="text-sm">Date</Label>
                <Input id="sale-date" type="date" className="h-10"
                  value={saleDate} onChange={e => setSaleDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Payment</Label>
                <Select value={paymentType} onValueChange={v => setPaymentType(v as PaymentType)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="installment">Installments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sale-notes" className="text-sm">Notes</Label>
              <Textarea id="sale-notes" rows={2} placeholder="Optional notes…"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {/* ── Warranty ────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Warranty</Label>
                <Select value={String(warrantyDays)} onValueChange={v => setWarrantyDays(Number(v))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WARRANTY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {warrantyDays > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Expiry Date</Label>
                  <div className="h-10 flex items-center rounded-md border bg-muted/50 px-3 text-sm">
                    {warrantyExpiry(saleDate, warrantyDays) ?? '—'}
                  </div>
                </div>
              )}
            </div>

            {/* ── Specs Promised ──────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="qsale-specs" className="text-sm">Specs Promised to Customer</Label>
              <Textarea id="qsale-specs" rows={2}
                placeholder="What was promised to the customer…"
                value={specsPromised} onChange={e => setSpecsPromised(e.target.value)} />
            </div>

            {/* ── Totals summary ─────────────────────────── */}
            {items.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total cost</span>
                  <span>{pkr(totalCost)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total sell</span>
                  <span>{pkr(totalSell)}</span>
                </div>
                <Separator />
                <div className={cn('flex justify-between font-bold', profit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                  <span>Profit</span>
                  <span>{pkr(profit)} <span className="font-normal text-xs">({margin}%)</span></span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}

            <DialogFooter className="pt-1">
              <Button type="button" variant="outline" className="h-11"
                onClick={() => handleOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 flex-1" disabled={saving || items.length === 0}>
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving…</>
                  : 'Create Sale'
                }
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

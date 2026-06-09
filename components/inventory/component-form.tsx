'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Component, ComponentInsert } from '@/types/database'

type FormData = Omit<ComponentInsert,'id'|'created_at'|'updated_at'|'supplier_id'>
const CATEGORIES = ['RAM','SSD','HDD','Charger','Battery','Screen','Keyboard','Fan','Other']
const EMPTY: FormData = { category:'RAM', name:'', specification:'', cost_price:0, sell_price:0, quantity:0, notes:'' }

interface Props { open: boolean; onOpenChange: (v: boolean) => void; initial?: Component | null; onSave: (data: FormData, id?: string) => Promise<void> }

const LBL: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#3F3F46', marginBottom: 6 }
const G2: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const G3: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }

export function ComponentForm({ open, onOpenChange, initial, onSave }: Props) {
  const [form, setForm] = useState<FormData>(() => initial
    ? { category:initial.category, name:initial.name, specification:initial.specification??'', cost_price:initial.cost_price, sell_price:initial.sell_price, quantity:initial.quantity, notes:initial.notes??'' }
    : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(v: boolean) {
    if (!v) { setError(null) }
    else { setForm(initial ? { category:initial.category, name:initial.name, specification:initial.specification??'', cost_price:initial.cost_price, sell_price:initial.sell_price, quantity:initial.quantity, notes:initial.notes??'' } : EMPTY) }
    onOpenChange(v)
  }
  function set<K extends keyof FormData>(key: K, value: FormData[K]) { setForm(prev => ({ ...prev, [key]: value })) }

  const profit = form.sell_price - form.cost_price
  const margin = form.sell_price > 0 ? ((profit / form.sell_price) * 100).toFixed(1) : '0.0'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (form.cost_price <= 0 || form.sell_price <= 0) { setError('Cost price and sell price must be greater than 0.'); return }
    setSaving(true); setError(null)
    try { await onSave(form, initial?.id); onOpenChange(false) }
    catch (err) { setError((err as { message?: string })?.message ?? 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader><DialogTitle>{initial ? 'Edit Component' : 'Add Component'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div style={G2}>
            <div><label style={LBL}>Category</label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label style={LBL}>Name *</label><Input placeholder="Kingston DDR4" style={{ height: 44 }} value={form.name} onChange={e => set('name', e.target.value)} /></div>
          </div>
          <div><label style={LBL}>Specification</label><Input placeholder="8GB DDR4 3200MHz" style={{ height: 44 }} value={form.specification ?? ''} onChange={e => set('specification', e.target.value)} /></div>
          <div style={G3}>
            <div><label style={LBL}>Cost (PKR)</label><Input type="number" min={0} style={{ height: 44 }} value={form.cost_price || ''} placeholder="0" onChange={e => set('cost_price', Number(e.target.value))} /></div>
            <div><label style={LBL}>Sell (PKR)</label><Input type="number" min={0} style={{ height: 44 }} value={form.sell_price || ''} placeholder="0" onChange={e => set('sell_price', Number(e.target.value))} /></div>
            <div><label style={LBL}>Qty</label><Input type="number" min={0} style={{ height: 44 }} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} /></div>
          </div>

          {form.cost_price > 0 && form.sell_price > 0 && (
            <div style={{ borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13, backgroundColor: profit >= 0 ? '#ECFDF5' : '#FEF2F2', color: profit >= 0 ? '#047857' : '#B91C1C' }}>
              <span>Profit per unit</span>
              <span style={{ fontWeight: 600 }}>PKR {profit.toLocaleString()} ({margin}%)</span>
            </div>
          )}

          <div><label style={LBL}>Notes</label><Textarea placeholder="Any additional notes…" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>

          {error && <p style={{ fontSize: 13, color: '#EF4444', backgroundColor: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

          <DialogFooter style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
            <Button type="button" variant="outline" style={{ height: 44 }} onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" style={{ height: 44, minWidth: 96 }} disabled={saving}>
              {saving ? '…' : initial ? 'Save Changes' : 'Add Component'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

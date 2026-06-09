'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { StepIndicator } from './step-indicator'
import { StepLaptopSelect } from './step-laptop-select'
import { StepComponentsAdd } from './step-components-add'
import { StepReview } from './step-review'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { computeTotals } from './types'
import type { Laptop, Component } from '@/types/database'
import type { SelectedComponent, ConfigStep } from './types'

export function ConfigBuilder() {
  const supabase = useMemo(() => createClient(), [])
  const [laptops,   setLaptops]   = useState<Laptop[]>([])
  const [components,setComponents]= useState<Component[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [step,      setStep]      = useState<ConfigStep>(1)
  const [selectedLaptop,      setSelectedLaptop]      = useState<Laptop | null>(null)
  const [selectedComponents,  setSelectedComponents]  = useState<SelectedComponent[]>([])
  const [savedConfigId,       setSavedConfigId]       = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [laptopRes, compRes] = await Promise.all([
      supabase.from('laptops').select('*').order('brand').order('model'),
      supabase.from('components').select('*').order('category').order('name'),
    ])
    if (laptopRes.error) setLoadError(laptopRes.error.message)
    else setLaptops(laptopRes.data ?? [])
    if (compRes.error) setLoadError(compRes.error.message)
    else setComponents(compRes.data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function updateComponent(compId: string, qty: number) {
    const comp = components.find(c => c.id === compId)
    if (!comp) return
    setSelectedComponents(prev => {
      if (qty <= 0) return prev.filter(s => s.component.id !== compId)
      const existing = prev.find(s => s.component.id === compId)
      if (existing) return prev.map(s => s.component.id === compId ? { ...s, quantity: qty } : s)
      return [...prev, { component: comp, quantity: qty }]
    })
  }

  function reset() {
    setStep(1); setSelectedLaptop(null); setSelectedComponents([]); setSavedConfigId(null)
  }

  async function saveConfig(): Promise<string> {
    if (!selectedLaptop) throw new Error('No laptop selected')
    const { totalCost, totalSell, laptopCost, laptopSell } = computeTotals(selectedLaptop, selectedComponents)
    const { data, error: configErr } = await supabase.from('configs')
      .insert({ laptop_id: selectedLaptop.id, laptop_cost_snapshot: laptopCost, laptop_sell_snapshot: laptopSell, total_cost_price: totalCost, total_sell_price: totalSell })
      .select('id').single()
    if (configErr) throw configErr
    if (selectedComponents.length > 0) {
      const items = selectedComponents.map(({ component, quantity }) => ({
        config_id: data.id, component_id: component.id, quantity,
        cost_price_snapshot: component.cost_price, sell_price_snapshot: component.sell_price,
      }))
      const { error } = await supabase.from('config_items').insert(items)
      if (error) throw error
    }
    setSavedConfigId(data.id)
    return data.id
  }

  async function convertToSale(configId: string, finalSellPricePerUnit: number, quantity: number, warrantyDays: number, specsPromised: string | null) {
    if (!selectedLaptop) throw new Error('No laptop selected')
    const { totalCost } = computeTotals(selectedLaptop, selectedComponents)
    const { data: saleData, error: saleErr } = await supabase.from('sales')
      .insert({ config_id: configId, total_cost_price: totalCost * quantity, total_sell_price: finalSellPricePerUnit * quantity, payment_type: 'cash', sale_date: new Date().toISOString().split('T')[0], warranty_days: warrantyDays, specs_promised: specsPromised, serial_number: selectedLaptop.serial_number ?? null })
      .select('id').single()
    if (saleErr) throw saleErr
    const saleItems = [
      { sale_id: saleData.id, item_type: 'laptop' as const, laptop_id: selectedLaptop.id, component_id: null, quantity, cost_price_snapshot: selectedLaptop.cost_price, sell_price_snapshot: selectedLaptop.sell_price ?? 0 },
      ...selectedComponents.map(({ component, quantity: cQty }) => ({
        sale_id: saleData.id, item_type: 'component' as const, laptop_id: null, component_id: component.id,
        quantity: quantity * cQty, cost_price_snapshot: component.cost_price, sell_price_snapshot: component.sell_price,
      })),
    ]
    const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems)
    if (itemsErr) throw itemsErr
    await Promise.all([
      supabase.from('laptops').update({ quantity: Math.max(0, selectedLaptop.quantity - quantity) }).eq('id', selectedLaptop.id),
      ...selectedComponents.map(({ component, quantity: cQty }) =>
        supabase.from('components').update({ quantity: Math.max(0, component.quantity - quantity * cQty) }).eq('id', component.id)
      ),
    ])
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
        <div className="fc-spin" style={{ width: 32, height: 32, border: '3px solid #F0EEE8', borderTopColor: '#F97316', borderRadius: '50%' }} />
        <p style={{ fontSize: 13, color: '#A1A1AA' }}>Loading inventory…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#EF4444' }}>{loadError}</p>
        <Button variant="outline" onClick={loadData}>Retry</Button>
      </div>
    )
  }

  const stepContent = () => {
    switch (step) {
      case 1: return <StepLaptopSelect laptops={laptops} selected={selectedLaptop} onSelect={l => { setSelectedLaptop(l); setSavedConfigId(null) }} />
      case 2: return <StepComponentsAdd components={components} selected={selectedComponents} onUpdate={updateComponent} />
      case 3: return selectedLaptop ? <StepReview laptop={selectedLaptop} components={selectedComponents} onSave={saveConfig} onConvertToSale={convertToSale} onReset={reset} savedConfigId={savedConfigId} /> : null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Step indicator */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #F0EEE8', padding: '12px 16px', boxSizing: 'border-box', width: '100%' }}>
        <StepIndicator current={step} />
      </div>

      {/* Step heading */}
      <div style={{ padding: '12px 16px 4px', boxSizing: 'border-box', width: '100%' }}>
        {step === 1 && <>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>Select Base Laptop</h2>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 2, wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>Choose the laptop this configuration will be built on</p>
        </>}
        {step === 2 && <>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>Add Components <span style={{ fontSize: 12, fontWeight: 400, color: '#A1A1AA' }}>(optional)</span></h2>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 2, wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>Base: {selectedLaptop?.brand} {selectedLaptop?.model}</p>
        </>}
        {step === 3 && <>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>Review &amp; Save</h2>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 2, wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>Check everything before saving or selling</p>
        </>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px', boxSizing: 'border-box', width: '100%' }}>
        {stepContent()}
      </div>

      {/* Nav buttons */}
      {step < 3 && (
        <div style={{ flexShrink: 0, borderTop: '1px solid #F0EEE8', backgroundColor: '#fff', padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(prev => (prev - 1) as ConfigStep)} style={{ height: 48 }}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> Back
              </Button>
            )}
            <Button
              style={{ flex: 1, height: 48 }}
              onClick={() => setStep(prev => (prev + 1) as ConfigStep)}
              disabled={step === 1 && !selectedLaptop}
            >
              {step === 1 ? 'Next: Add Components' : 'Next: Review'}
              <ChevronRight style={{ width: 16, height: 16 }} />
            </Button>
          </div>
          {step === 1 && !selectedLaptop && (
            <p style={{ fontSize: 12, color: '#A1A1AA', textAlign: 'center', marginTop: 6 }}>Select a laptop to continue</p>
          )}
        </div>
      )}
      {step === 3 && (
        <div style={{ flexShrink: 0, borderTop: '1px solid #F0EEE8', backgroundColor: '#fff', padding: '12px 16px' }}>
          <Button variant="outline" style={{ width: '100%', height: 40 }} onClick={() => setStep(2)}>
            <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Components
          </Button>
        </div>
      )}
    </div>
  )
}

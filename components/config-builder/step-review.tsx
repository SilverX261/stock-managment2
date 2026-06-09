'use client'

import { useState } from 'react'
import {
  Monitor, HardDrive, MemoryStick, Cpu, Check,
  TrendingUp, TrendingDown, ShoppingCart, Save, RotateCcw, AlertCircle, ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { computeTotals, totalRamGb, pkr } from './types'
import { WARRANTY_OPTIONS, warrantyLabel, warrantyExpiry } from '@/components/sales/types'
import type { Laptop } from '@/types/database'
import type { SelectedComponent } from './types'

function storageLabel(gb: number) {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`
}

const CONDITION_VARIANT: Record<Laptop['condition'], 'success' | 'warning' | 'info'> = {
  new: 'success', used: 'warning', refurbished: 'info',
}

/** Auto-build a spec summary string from the config for the customer receipt */
function buildSpecsSummary(laptop: Laptop, components: SelectedComponent[]): string {
  const parts: string[] = [`${laptop.brand} ${laptop.model}`]
  if (laptop.processor) parts.push(laptop.processor)

  const upgradeRam = components.some(c => c.component.category === 'RAM')
  const totalRam = totalRamGb(laptop, components)
  parts.push(`${totalRam}GB RAM${upgradeRam ? ' (upgraded)' : ''}`)

  const gbStr = (gb: number) => gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`
  parts.push(`${gbStr(laptop.base_storage_gb)} ${laptop.storage_type}`)

  if (laptop.display_size) parts.push(`${laptop.display_size}" display`)

  for (const { component, quantity } of components.filter(c => c.component.category !== 'RAM')) {
    const spec = component.specification ? ` (${component.specification})` : ''
    parts.push(quantity > 1 ? `${quantity}× ${component.name}${spec}` : `${component.name}${spec}`)
  }

  return parts.join(', ')
}

interface Props {
  laptop: Laptop
  components: SelectedComponent[]
  onSave: () => Promise<string>
  onConvertToSale: (
    configId: string,
    finalSellPricePerUnit: number,
    quantity: number,
    warrantyDays: number,
    specsPromised: string | null,
  ) => Promise<void>
  onReset: () => void
  savedConfigId: string | null
}

type FinalizedSale = { sellPrice: number; profit: number; margin: number }

export function StepReview({ laptop, components, onSave, onConvertToSale, onReset, savedConfigId }: Props) {
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [configId, setConfigId] = useState<string | null>(savedConfigId)
  const [saleCreated, setSaleCreated] = useState(false)
  const [finalizedSale, setFinalizedSale] = useState<FinalizedSale | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Feature 1: Quantity
  const maxQty = Math.max(1, laptop.quantity)
  const [quantity, setQuantity] = useState(1)

  // Price override (per unit)
  const [overrideInput, setOverrideInput] = useState('')

  // Feature 2: Warranty & specs
  const [warrantyDays, setWarrantyDays] = useState(0)
  const [specsPromised, setSpecsPromised] = useState(() => buildSpecsSummary(laptop, components))

  // ── Derived values ────────────────────────────────────────────
  const laptopPriceKnown = laptop.sell_price !== null
  const { totalCost, totalSell, compSell } = computeTotals(laptop, components)
  const totalRam = totalRamGb(laptop, components)
  const ramUpgrades = components.filter(c => c.component.category === 'RAM')
  const storageUpgrades = components.filter(c => ['SSD', 'HDD', 'NVMe'].includes(c.component.category))
  const otherComponents = components.filter(
    c => !['RAM', 'SSD', 'HDD', 'NVMe'].includes(c.component.category)
  )

  const overrideNum = overrideInput !== '' ? Number(overrideInput) : null
  const validOverride = overrideNum !== null && !isNaN(overrideNum) && overrideNum > 0
  const effectiveSellPerUnit = validOverride ? (overrideNum as number) : totalSell
  const isBelowCost = validOverride && (overrideNum as number) < totalCost
  const hasSellPrice = laptopPriceKnown || validOverride

  const totalCostAll = totalCost * quantity
  const totalSellAll = effectiveSellPerUnit * quantity
  const finalProfit = (effectiveSellPerUnit - totalCost) * quantity
  const finalMargin = effectiveSellPerUnit > 0
    ? ((effectiveSellPerUnit - totalCost) / effectiveSellPerUnit) * 100
    : 0

  const saleDate = new Date().toISOString().split('T')[0]
  const expiryDate = warrantyExpiry(saleDate, warrantyDays)

  // ── Handlers ──────────────────────────────────────────────────

  function handleQtyChange(raw: string) {
    const n = parseInt(raw, 10)
    if (isNaN(n)) return
    setQuantity(Math.max(1, Math.min(maxQty, n)))
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const id = await onSave()
      setConfigId(id)
    } catch (e) {
      console.error('Config save error:', e)
      setError((e as { message?: string })?.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleConvert() {
    setConverting(true); setError(null)
    try {
      let id = configId
      if (!id) {
        id = await onSave()
        setConfigId(id)
      }
      await onConvertToSale(
        id,
        effectiveSellPerUnit,
        quantity,
        warrantyDays,
        specsPromised.trim() || null,
      )
      setFinalizedSale({
        sellPrice: totalSellAll,
        profit: finalProfit,
        margin: finalMargin,
      })
      setSaleCreated(true)
    } catch (e) {
      console.error('Convert to sale error:', e)
      setError((e as { message?: string })?.message ?? 'Failed to convert to sale')
    } finally {
      setConverting(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────
  if (saleCreated && finalizedSale) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Sale Created!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {quantity > 1 ? `${quantity}× ` : ''}{laptop.brand} {laptop.model} recorded as a sale.
          </p>
        </div>
        <div className="rounded-lg bg-muted px-6 py-4 text-left w-full max-w-xs space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Sell</span>
            <span className="font-semibold">{pkr(finalizedSale.sellPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Profit</span>
            <span className={cn('font-semibold', finalizedSale.profit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
              {pkr(finalizedSale.profit)} ({finalizedSale.margin.toFixed(1)}%)
            </span>
          </div>
          {warrantyDays > 0 && (
            <div className="flex justify-between text-sm pt-1 border-t mt-1">
              <span className="text-muted-foreground">Warranty</span>
              <span className="font-medium">{warrantyLabel(warrantyDays)}</span>
            </div>
          )}
        </div>
        <Button onClick={onReset} variant="outline" className="h-11 gap-2 w-full max-w-xs">
          <RotateCcw className="w-4 h-4" />
          Build Another Config
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Laptop card ─────────────────────────────────── */}
      <div className="p-4 card-border">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-bold leading-tight">{laptop.brand} {laptop.model}</h3>
            {laptop.processor && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> {laptop.processor}
              </p>
            )}
          </div>
          <Badge variant={CONDITION_VARIANT[laptop.condition]} className="capitalize shrink-0">
            {laptop.condition}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MemoryStick className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              {ramUpgrades.length > 0 ? (
                <>
                  <span className="text-muted-foreground">{laptop.base_ram_gb} GB base</span>
                  {ramUpgrades.map(r => (
                    <span key={r.component.id} className="text-primary">
                      {' '}+ {r.quantity > 1 ? `${r.quantity}× ` : ''}{r.component.name}
                    </span>
                  ))}
                  <span className="font-semibold text-foreground">
                    {' '}= <span className="text-primary">{totalRam} GB total RAM</span>
                  </span>
                </>
              ) : (
                <span><span className="font-medium">{laptop.base_ram_gb} GB</span> RAM</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <HardDrive className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              {storageUpgrades.length > 0 ? (
                <>
                  <span className="text-muted-foreground">
                    {storageLabel(laptop.base_storage_gb)} {laptop.storage_type} base
                  </span>
                  {storageUpgrades.map(s => (
                    <span key={s.component.id} className="text-primary">
                      {' '}+ {s.quantity > 1 ? `${s.quantity}× ` : ''}{s.component.name}
                      {s.component.specification ? ` (${s.component.specification})` : ''}
                    </span>
                  ))}
                </>
              ) : (
                <span>
                  <span className="font-medium">{storageLabel(laptop.base_storage_gb)}</span>{' '}
                  {laptop.storage_type}
                </span>
              )}
            </div>
          </div>

          {laptop.display_size && (
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="font-medium">{laptop.display_size}&quot;</span> display</span>
            </div>
          )}

          {otherComponents.length > 0 && (
            <div className="flex items-start gap-2">
              <Cpu className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1">
                {otherComponents.map(c => (
                  <Badge key={c.component.id} variant="secondary" className="text-xs">
                    {c.quantity > 1 ? `${c.quantity}× ` : ''}{c.component.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Component breakdown ───────────────────────────── */}
      {components.length > 0 && (
        <div className="p-4 card-border">
          <p className="text-sm font-semibold mb-3">Added Components</p>
          <div className="space-y-2">
            {components.map(({ component, quantity: cQty }) => (
              <div key={component.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{component.name}</span>
                  {component.specification && (
                    <span className="text-muted-foreground"> · {component.specification}</span>
                  )}
                  {cQty > 1 && <span className="text-muted-foreground"> × {cQty}</span>}
                </div>
                <span className="font-medium">{pkr(component.sell_price * cQty)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pricing card ─────────────────────────────────── */}
      <div className="p-4 card-border space-y-3">
        <p className="text-sm font-semibold">Pricing</p>

        {/* Per-unit breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base laptop cost</span>
            <span>{pkr(laptop.cost_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base laptop sell</span>
            {laptopPriceKnown
              ? <span>{pkr(laptop.sell_price as number)}</span>
              : <span className="text-muted-foreground italic">Price TBD</span>
            }
          </div>
          {components.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Components sell</span>
              <span>{pkr(compSell)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Quantity */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="qty" className="text-sm font-medium">Quantity</Label>
            <p className="text-xs text-muted-foreground">{maxQty} in stock</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="qty"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={e => handleQtyChange(e.target.value)}
              className="h-10 w-20 text-center text-base font-semibold"
            />
            {quantity > 1 && (
              <span className="text-xs text-muted-foreground">units</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Totals scaled by quantity */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Total cost{quantity > 1 ? ` (× ${quantity})` : ''}
            </span>
            <span className="font-medium">{pkr(totalCostAll)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Suggested sell{quantity > 1 ? ` (× ${quantity})` : ''}
            </span>
            {laptopPriceKnown
              ? <span className="font-medium">{pkr(totalSell * quantity)}</span>
              : <span className="text-muted-foreground italic">Price TBD</span>
            }
          </div>
        </div>

        <Separator />

        {/* Final sell price override (per unit) */}
        <div className="space-y-1.5">
          <Label htmlFor="final-sell" className="text-sm font-medium flex items-center justify-between">
            <span>Final Sell Price per Unit (PKR)</span>
            {laptopPriceKnown && (
              <span className="text-xs font-normal text-muted-foreground">override suggested</span>
            )}
          </Label>
          <Input
            id="final-sell"
            type="number"
            min={0}
            className="h-12 text-base font-medium"
            placeholder={laptopPriceKnown ? totalSell.toString() : 'Enter sell price'}
            value={overrideInput}
            onChange={e => setOverrideInput(e.target.value)}
          />
          {overrideInput === '' && laptopPriceKnown && (
            <p className="text-xs text-muted-foreground pl-0.5">
              Using suggested: <span className="font-medium">{pkr(totalSell)}</span> per unit
              {quantity > 1 && (
                <> → <span className="font-medium">{pkr(totalSell * quantity)}</span> total</>
              )}
            </p>
          )}
          {validOverride && quantity > 1 && !isBelowCost && (
            <p className="text-xs text-muted-foreground pl-0.5">
              Total for {quantity} units: <span className="font-medium">{pkr(totalSellAll)}</span>
            </p>
          )}
          {isBelowCost && (
            <p className="text-xs font-medium text-destructive flex items-center gap-1.5 pl-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Selling below cost price
            </p>
          )}
        </div>

        <Separator />

        {/* Profit box */}
        {hasSellPrice ? (
          <div className={cn(
            'rounded-lg px-4 py-3 flex items-center justify-between',
            finalProfit >= 0
              ? 'bg-emerald-50'
              : 'bg-red-50'
          )}>
            <div className="flex items-center gap-2">
              {finalProfit >= 0
                ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                : <TrendingDown className="w-4 h-4 text-destructive" />
              }
              <div>
                <span className="text-sm font-medium">Profit</span>
                {quantity > 1 && (
                  <span className="text-xs text-muted-foreground ml-1.5">
                    ({pkr((effectiveSellPerUnit - totalCost))}/unit)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                'text-lg font-bold',
                finalProfit >= 0 ? 'text-emerald-700' : 'text-destructive'
              )}>
                {pkr(finalProfit)}
              </span>
              <span className={cn(
                'text-sm ml-2 font-medium',
                finalProfit >= 0 ? 'text-emerald-600' : 'text-destructive'
              )}>
                ({finalMargin.toFixed(1)}%)
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg px-3 py-2.5 bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Enter a sell price above to calculate profit
          </div>
        )}
      </div>

      {/* ── Sale Details card ────────────────────────────── */}
      <div className="p-4 card-border space-y-4">
        <p className="text-sm font-semibold">Sale Details</p>

        {/* Warranty dropdown + expiry */}
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
          {warrantyDays > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Expires
              </Label>
              <div className="h-10 flex items-center rounded-md border bg-muted/50 px-3 text-sm font-medium">
                {expiryDate}
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Specs promised — auto-filled, editable */}
        <div className="space-y-1.5">
          <Label htmlFor="specs" className="text-sm">Specifications Promised to Customer</Label>
          <Textarea
            id="specs"
            rows={3}
            value={specsPromised}
            onChange={e => setSpecsPromised(e.target.value)}
            placeholder="What was promised to the customer…"
            className="text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            Auto-filled from config — edit if needed
          </p>
        </div>
      </div>

      {/* ── Saved state ──────────────────────────────────── */}
      {configId && !saleCreated && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          <Check className="w-4 h-4 shrink-0" />
          Config saved — ready to convert to sale
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">
        {!configId && (
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={handleSave}
            disabled={saving || converting}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <><Save className="w-4 h-4" /> Save Config Only</>
            )}
          </Button>
        )}

        <Button
          className="w-full h-12 gap-2 text-base"
          onClick={handleConvert}
          disabled={saving || converting || !hasSellPrice}
        >
          {converting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating sale…
            </span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {configId ? 'Convert to Sale' : 'Save & Convert to Sale'}
              {quantity > 1 && ` (${quantity} units)`}
            </>
          )}
        </Button>

        {!hasSellPrice && (
          <p className="text-xs text-center text-muted-foreground">
            Enter a Final Sell Price above, or set a sell price on this laptop in Inventory
          </p>
        )}

        <button
          onClick={onReset}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
        >
          Start over
        </button>
      </div>
    </div>
  )
}

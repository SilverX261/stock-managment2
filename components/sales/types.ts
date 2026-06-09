import type { Sale, Customer, Laptop, Component } from '@/types/database'

export type SaleItemFull = {
  id: string
  sale_id: string
  item_type: 'laptop' | 'component'
  laptop_id: string | null
  component_id: string | null
  quantity: number
  cost_price_snapshot: number
  sell_price_snapshot: number
  laptop: Pick<Laptop, 'id' | 'brand' | 'model' | 'processor' | 'base_ram_gb' | 'base_storage_gb' | 'storage_type' | 'display_size'> | null
  component: Pick<Component, 'id' | 'name' | 'category' | 'specification'> | null
}

export type SaleFull = Sale & {
  customer: Pick<Customer, 'id' | 'name' | 'phone'> | null
  sale_items: SaleItemFull[]
}

/** A form line item (laptop or component) being added manually */
export type FormItem = {
  type: 'laptop' | 'component'
  id: string
  name: string
  quantity: number
  costPrice: number
  sellPrice: number
  stockQty?: number       // only set for laptop items — used to cap quantity and show hint
  serialNumber?: string | null  // copied from laptop for the sale record
}

export type PaymentType = 'cash' | 'installment' | 'card' | 'bank_transfer'

// ── Warranty ────────────────────────────────────────────────────

export const WARRANTY_OPTIONS = [
  { value: 0,   label: 'No warranty' },
  { value: 7,   label: '7 days' },
  { value: 15,  label: '15 days' },
  { value: 30,  label: '30 days' },
  { value: 90,  label: '3 months' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
] as const

export function warrantyLabel(days: number): string {
  const opt = WARRANTY_OPTIONS.find(o => o.value === days)
  return opt ? opt.label : `${days} days`
}

export function warrantyExpiry(saleDateStr: string, days: number): string | null {
  if (!days) return null
  const d = new Date(saleDateStr)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Phone helpers ────────────────────────────────────────────────

/** WhatsApp: convert PK phone to E.164 (without +) */
export function toWaNumber(phone: string | null): string | null {
  if (!phone) return null
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('92') && d.length === 12) return d
  if (d.startsWith('0') && d.length === 11) return '92' + d.slice(1)
  if (d.length === 10) return '92' + d
  return null
}

// ── WhatsApp message builder ─────────────────────────────────────

/** Build the WhatsApp message for a completed sale */
export function buildWhatsAppMessage(sale: SaleFull): string {
  const date = new Date(sale.sale_date).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const fmt = (n: number) => n.toLocaleString('en-PK')
  const profit = sale.total_sell_price - sale.total_cost_price
  const margin = sale.total_sell_price > 0
    ? ((profit / sale.total_sell_price) * 100).toFixed(1)
    : '0'

  const laptops = sale.sale_items.filter(i => i.item_type === 'laptop')
  const components = sale.sale_items.filter(i => i.item_type === 'component')

  const lines: string[] = [
    '*Fine Computers* 🖥️',
    'Trust Plaza, Sargodha',
    '',
    `📅 Date: ${date}`,
  ]

  if (sale.customer?.name) lines.push(`👤 Customer: ${sale.customer.name}`)

  lines.push('', '*📋 Purchase Details:*', '')

  laptops.forEach(item => {
    if (!item.laptop) return
    const l = item.laptop
    lines.push(`🖥️ *${l.brand} ${l.model}*${item.quantity > 1 ? ` ×${item.quantity}` : ''}`)
    if (l.processor) lines.push(`   ${l.processor}`)
    lines.push(`   ${l.base_ram_gb}GB RAM · ${l.base_storage_gb >= 1024 ? `${l.base_storage_gb / 1024}TB` : `${l.base_storage_gb}GB`} ${l.storage_type}`)
    if (l.display_size) lines.push(`   ${l.display_size}" Display`)
    lines.push(`   💰 PKR ${fmt(item.sell_price_snapshot)}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`)
    lines.push('')
  })

  if (components.length > 0) {
    lines.push('*Accessories & Upgrades:*')
    components.forEach(item => {
      if (!item.component) return
      const qty = item.quantity > 1 ? ` ×${item.quantity}` : ''
      const spec = item.component.specification ? ` (${item.component.specification})` : ''
      const total = item.sell_price_snapshot * item.quantity
      lines.push(`• ${item.component.name}${spec}${qty} — PKR ${fmt(total)}`)
    })
    lines.push('')
  }

  // Specs promised
  if (sale.specs_promised) {
    lines.push(`📝 *Specs:* ${sale.specs_promised}`, '')
  }

  const payLabel: Record<string, string> = {
    cash: 'Cash', installment: 'Installments', card: 'Card', bank_transfer: 'Bank Transfer',
  }

  lines.push(
    '━━━━━━━━━━━━━━━━━━━━',
    `💰 *Total: PKR ${fmt(sale.total_sell_price)}*`,
    `💳 Payment: ${payLabel[sale.payment_type] ?? sale.payment_type}`,
  )

  // Warranty
  if (sale.warranty_days > 0) {
    const expiry = warrantyExpiry(sale.sale_date, sale.warranty_days)
    lines.push(`🛡️ Warranty: ${warrantyLabel(sale.warranty_days)}`)
    if (expiry) lines.push(`   Expires: ${expiry}`)
  }

  lines.push(
    '',
    `_Munafa (Profit): PKR ${fmt(profit)} (${margin}%)_`,
    '',
    '🙏 Shukriya aapki khareedari ke liye!',
    'Fine Computers | Trust Plaza, Sargodha',
  )

  return lines.join('\n')
}

/**
 * Returns a compact string of added components for display in sale cards.
 * e.g. "8GB RAM, 65W Charger" — null when no components.
 */
export function saleConfigSummary(sale: SaleFull): string | null {
  const comps = sale.sale_items.filter(i => i.item_type === 'component' && i.component)
  if (!comps.length) return null
  return comps
    .map(i => (i.quantity > 1 ? `${i.quantity}× ${i.component!.name}` : i.component!.name))
    .join(', ')
}

/** First laptop in sale items (for display label) */
export function salePrimaryLabel(sale: SaleFull): string {
  const laptop = sale.sale_items.find(i => i.item_type === 'laptop')?.laptop
  if (laptop) return `${laptop.brand} ${laptop.model}`
  const count = sale.sale_items.length
  return `Component Sale (${count} item${count !== 1 ? 's' : ''})`
}

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  cash: 'Cash', installment: 'Installments', card: 'Card', bank_transfer: 'Bank Transfer',
}

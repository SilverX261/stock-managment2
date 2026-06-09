'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WhatsAppShare } from './whatsapp-share'
import { Monitor, Cpu, User, Clock, TrendingUp, TrendingDown, Printer, ShieldCheck } from 'lucide-react'
import type { SaleFull } from './types'
import { PAYMENT_LABELS, salePrimaryLabel, warrantyLabel, warrantyExpiry } from './types'

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`
const fmt = (n: number) => n.toLocaleString('en-PK')
const CARD: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 12, padding: '14px 16px' }
const DIV: React.CSSProperties  = { height: 1, backgroundColor: '#F0EEE8', margin: '8px 0' }

function printReceipt(sale: SaleFull) {
  const profit = sale.total_sell_price - sale.total_cost_price
  const margin = sale.total_sell_price > 0 ? ((profit/sale.total_sell_price)*100).toFixed(1) : '0'
  const date = new Date(sale.sale_date).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })
  const time = new Date(sale.created_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', hour12:true })
  const laptops = sale.sale_items.filter(i => i.item_type === 'laptop')
  const comps   = sale.sale_items.filter(i => i.item_type === 'component')
  const wLabel  = sale.warranty_days > 0 ? warrantyLabel(sale.warranty_days) : null
  const wExpiry = sale.warranty_days > 0 ? warrantyExpiry(sale.sale_date, sale.warranty_days) : null
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt — Fine Computers</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:monospace;font-size:13px;padding:16px;max-width:320px;margin:auto;}.c{text-align:center;}.b{font-weight:bold;}.hr{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:3px 0;}h1{font-size:18px;margin-bottom:2px;}h2{font-size:12px;font-weight:normal;}.tot{font-size:15px;font-weight:bold;}</style></head><body><div class="c"><h1>Fine Computers</h1><h2>Trust Plaza, Sargodha</h2><div>— Receipt —</div></div><div class="hr"></div><div class="row"><span>Date</span><span>${date}</span></div><div class="row"><span>Time</span><span>${time}</span></div>${sale.customer?.name?`<div class="row"><span>Customer</span><span>${sale.customer.name}</span></div>`:''} ${sale.customer?.phone?`<div class="row"><span>Phone</span><span>${sale.customer.phone}</span></div>`:''}<div class="hr"></div>${laptops.map(item=>item.laptop?`<div class="b">${item.laptop.brand} ${item.laptop.model}${item.quantity>1?' ×'+item.quantity:''}</div>${item.laptop.processor?`<div>${item.laptop.processor}</div>`:''}<div>${item.laptop.base_ram_gb}GB RAM · ${item.laptop.base_storage_gb>=1024?`${item.laptop.base_storage_gb/1024}TB`:`${item.laptop.base_storage_gb}GB`} ${item.laptop.storage_type}</div><div class="row"><span>Price</span><span>PKR ${fmt(item.sell_price_snapshot)}${item.quantity>1?' ×'+item.quantity:''}</span></div>`:'').join('')}${comps.length>0?`<div class="hr"></div><div class="b">Accessories:</div>${comps.map(item=>item.component?`<div class="row"><span>${item.component.name}${item.quantity>1?' ×'+item.quantity:''}</span><span>PKR ${fmt(item.sell_price_snapshot*item.quantity)}</span></div>`:'').join('')}`:''} ${sale.specs_promised?`<div class="hr"></div><div class="b">Specs:</div><div style="font-size:11px;word-break:break-word">${sale.specs_promised}</div>`:''}<div class="hr"></div><div class="row tot"><span>Total</span><span>PKR ${fmt(sale.total_sell_price)}</span></div><div class="row"><span>Payment</span><span>${PAYMENT_LABELS[sale.payment_type]}</span></div><div class="row"><span>Profit</span><span>PKR ${fmt(profit)} (${margin}%)</span></div>${wLabel?`<div class="hr"></div><div class="row"><span>Warranty</span><span>${wLabel}</span></div>${wExpiry?`<div class="row"><span>Expires</span><span>${wExpiry}</span></div>`:''}`:''}  <div class="hr"></div><div class="c">Shukriya aapki khareedari ke liye!</div><div class="c">Fine Computers | Trust Plaza, Sargodha</div></body></html>`
  const win = window.open('','_blank','width=420,height=700')
  if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => { win.print() }, 250) }
}

export function SaleDetailModal({ sale, onClose }: { sale: SaleFull | null; onClose: () => void }) {
  if (!sale) return null
  const profit      = sale.total_sell_price - sale.total_cost_price
  const margin      = sale.total_sell_price > 0 ? ((profit/sale.total_sell_price)*100).toFixed(1) : '0'
  const laptopItems = sale.sale_items.filter(i => i.item_type === 'laptop')
  const compItems   = sale.sale_items.filter(i => i.item_type === 'component')
  const created     = new Date(sale.created_at)
  const dateStr     = created.toLocaleDateString('en-PK', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
  const timeStr     = created.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', hour12:true })
  const wExpiry     = sale.warranty_days > 0 ? warrantyExpiry(sale.sale_date, sale.warranty_days) : null

  return (
    <Dialog open={!!sale} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 0, gap: 0 }}>
        <DialogHeader style={{ padding: '20px 20px 14px', borderBottom: '1px solid #F0EEE8' }}>
          <DialogTitle style={{ fontSize: 15 }}>{salePrimaryLabel(sale)}</DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A1A1AA', border: '1px solid #F0EEE8', borderRadius: 99, padding: '2px 8px' }}>
              <Clock style={{ width: 11, height: 11 }} />{dateStr} · {timeStr}
            </span>
            <span style={{ display: 'inline-flex', fontSize: 11, color: '#3F3F46', backgroundColor: '#F5F2EC', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
              {PAYMENT_LABELS[sale.payment_type]}
            </span>
            {sale.customer && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A1A1AA', border: '1px solid #F0EEE8', borderRadius: 99, padding: '2px 8px' }}><User style={{ width: 11, height: 11 }} />{sale.customer.name}</span>}
          </div>
        </DialogHeader>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Laptop items */}
          {laptopItems.map(item => item.laptop && (
            <div key={item.id} style={CARD}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Monitor style={{ width: 16, height: 16, marginTop: 2, color: '#A1A1AA', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{item.laptop.brand} {item.laptop.model}{item.quantity > 1 && <span style={{ fontSize: 11, fontWeight: 400, color: '#A1A1AA', marginLeft: 6 }}>× {item.quantity} units</span>}</p>
                    {item.laptop.processor && <p style={{ fontSize: 11, color: '#A1A1AA' }}>{item.laptop.processor}</p>}
                    <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>
                      {item.laptop.base_ram_gb}GB RAM · {item.laptop.base_storage_gb >= 1024 ? `${item.laptop.base_storage_gb/1024}TB` : `${item.laptop.base_storage_gb}GB`} {item.laptop.storage_type}{item.laptop.display_size && ` · ${item.laptop.display_size}"`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{pkr(item.sell_price_snapshot)}{item.quantity > 1 && <span style={{ fontSize: 11, fontWeight: 400, color: '#A1A1AA' }}> /unit</span>}</p>
                  <p style={{ fontSize: 11, color: '#A1A1AA' }}>cost: {pkr(item.cost_price_snapshot)}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Components */}
          {compItems.length > 0 && (
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accessories &amp; Upgrades</p>
              {compItems.map(item => item.component && (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cpu style={{ width: 13, height: 13, color: '#A1A1AA' }} />
                    <span style={{ fontSize: 13, color: '#0A0A0A' }}>{item.component.name}</span>
                    {item.component.specification && <span style={{ fontSize: 11, color: '#A1A1AA' }}>{item.component.specification}</span>}
                    {item.quantity > 1 && <span style={{ fontSize: 11, color: '#A1A1AA' }}>×{item.quantity}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{pkr(item.sell_price_snapshot * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#A1A1AA' }}>Total cost</span><span>{pkr(sale.total_cost_price)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}><span>Total sell</span><span>{pkr(sale.total_sell_price)}</span></div>
            <div style={DIV} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: '8px 12px', backgroundColor: profit >= 0 ? '#ECFDF5' : '#FEF2F2' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: profit >= 0 ? '#047857' : '#B91C1C' }}>
                {profit >= 0 ? <TrendingUp style={{ width: 15, height: 15 }} /> : <TrendingDown style={{ width: 15, height: 15 }} />} Profit
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: profit >= 0 ? '#047857' : '#B91C1C' }}>
                {pkr(profit)} <span style={{ fontSize: 11, fontWeight: 400 }}>({margin}%)</span>
              </span>
            </div>
          </div>

          {sale.specs_promised && (
            <div style={{ borderRadius: 10, backgroundColor: '#F5F2EC', padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#A1A1AA', marginBottom: 4 }}>Specifications Promised</p>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#3F3F46' }}>{sale.specs_promised}</p>
            </div>
          )}

          {sale.warranty_days > 0 && (
            <div style={{ border: '1px solid #F0EEE8', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck style={{ width: 16, height: 16, color: '#EA580C' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Warranty: {warrantyLabel(sale.warranty_days)}</p>
                {wExpiry && <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>Expires: {wExpiry}</p>}
              </div>
            </div>
          )}

          {sale.notes && (
            <div style={{ borderRadius: 10, backgroundColor: '#F5F2EC', padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: '#A1A1AA', marginBottom: 2 }}>Notes</p>
              <p style={{ fontSize: 13, color: '#3F3F46' }}>{sale.notes}</p>
            </div>
          )}

          {sale.customer && (
            <div style={{ border: '1px solid #F0EEE8', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User style={{ width: 16, height: 16, color: '#A1A1AA' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{sale.customer.name}</p>
                {sale.customer.phone && <p style={{ fontSize: 11, color: '#A1A1AA' }}>{sale.customer.phone}</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <WhatsAppShare sale={sale} variant="outline" size="default" label="WhatsApp" />
            <Button type="button" variant="outline" onClick={() => printReceipt(sale)}>
              <Printer style={{ width: 15, height: 15 }} /> Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

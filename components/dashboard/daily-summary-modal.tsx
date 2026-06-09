'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageCircle, Download, TrendingUp, Package, ShoppingCart } from 'lucide-react'
import { salePrimaryLabel } from '@/components/sales/types'
import type { SaleFull } from '@/components/sales/types'

const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`
const fmt = (n: number) => n.toLocaleString('en-PK')

interface Props { open: boolean; onClose: () => void; sales: SaleFull[]; laptopStock: number; componentStock: number }

function buildWhatsAppSummary(sales: SaleFull[], laptopStock: number, componentStock: number): string {
  const today = new Date().toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const revenue = sales.reduce((s,sale) => s+sale.total_sell_price, 0)
  const profit  = sales.reduce((s,sale) => s+(sale.total_sell_price-sale.total_cost_price), 0)
  const margin  = revenue > 0 ? ((profit/revenue)*100).toFixed(1) : '0'
  const lines: string[] = ['*Fine Computers* 🖥️',`*📊 Daily Summary — ${today}*`,'',`📦 Sales Today: *${sales.length}*`,`💰 Revenue: *PKR ${fmt(revenue)}*`,`📈 Profit: *PKR ${fmt(profit)}* (${margin}%)`,'']
  if (sales.length > 0) {
    lines.push('*Sales Breakdown:*')
    sales.forEach((sale, i) => lines.push(`${i+1}. ${sale.customer?.name ?? 'Walk-in'} — ${salePrimaryLabel(sale)} — PKR ${fmt(sale.total_sell_price)} (profit: ${fmt(sale.total_sell_price-sale.total_cost_price)})`))
    lines.push('')
  }
  lines.push('*📦 Remaining Stock:*',`💻 Laptops: ${laptopStock} unit${laptopStock!==1?'s':''}`,`🔧 Components: ${componentStock} item${componentStock!==1?'s':''}`, '','Fine Computers | Trust Plaza, Sargodha')
  return lines.join('\n')
}

async function downloadPDF(sales: SaleFull[], laptopStock: number, componentStock: number) {
  const { jsPDF } = await import('jspdf'); const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation:'p', unit:'mm', format:'a4' })
  const today = new Date().toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })
  const revenue = sales.reduce((s,sale) => s+sale.total_sell_price, 0)
  const profit  = sales.reduce((s,sale) => s+(sale.total_sell_price-sale.total_cost_price), 0)
  const margin  = revenue > 0 ? ((profit/revenue)*100).toFixed(1) : '0'
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('Fine Computers',14,18)
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(100); doc.text('Trust Plaza, Sargodha',14,25); doc.text(`Daily Report — ${today}`,14,31); doc.setTextColor(0)
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text("TODAY'S PERFORMANCE",14,42)
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(`Sales Count: ${sales.length}`,14,49); doc.text(`Revenue: PKR ${fmt(revenue)}`,14,55); doc.text(`Profit: PKR ${fmt(profit)}`,14,61); doc.text(`Profit Margin: ${margin}%`,14,67)
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('STOCK SUMMARY',120,42)
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(`Laptops: ${laptopStock} units`,120,49); doc.text(`Components: ${componentStock} items`,120,55)
  if (sales.length > 0) {
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('SALES DETAILS',14,80)
    const tableRows = sales.map((sale,i) => { const sp = sale.total_sell_price-sale.total_cost_price; return [String(i+1),sale.customer?.name??'Walk-in',salePrimaryLabel(sale),`PKR ${fmt(sale.total_sell_price)}`,`PKR ${fmt(sp)}`] })
    autoTable(doc, { startY:84, head:[['#','Customer','Item','Amount','Profit']], body:tableRows, theme:'striped', headStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[245,247,255]}, styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{cellWidth:8},1:{cellWidth:40},2:{cellWidth:65},3:{cellWidth:30,halign:'right'},4:{cellWidth:30,halign:'right'}} })
  } else { doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(120); doc.text('No sales recorded today.',14,80); doc.setTextColor(0) }
  doc.save(`fine-computers-daily-${new Date().toISOString().split('T')[0]}.pdf`)
}

const DIV: React.CSSProperties = { height: 1, backgroundColor: '#F0EEE8', margin: '4px 0' }

export function DailySummaryModal({ open, onClose, sales, laptopStock, componentStock }: Props) {
  const today   = new Date().toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const revenue = sales.reduce((s,sale) => s+sale.total_sell_price, 0)
  const profit  = sales.reduce((s,sale) => s+(sale.total_sell_price-sale.total_cost_price), 0)
  const margin  = revenue > 0 ? ((profit/revenue)*100).toFixed(1) : '0'

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{ maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, gap: 0, overflow: 'hidden' }}>
        <DialogHeader style={{ padding: '20px 20px 14px', borderBottom: '1px solid #F0EEE8', flexShrink: 0 }}>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
            <ShoppingCart style={{ width: 16, height: 16, color: '#A1A1AA' }} /> Daily Summary
          </DialogTitle>
          <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 3 }}>{today}</p>
        </DialogHeader>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ borderRadius: 10, backgroundColor: '#F5F2EC', padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A' }}>{sales.length}</p>
              <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>Sales</p>
            </div>
            <div style={{ borderRadius: 10, backgroundColor: '#FFF7ED', padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C2410C', lineHeight: 1.2 }}>{pkr(revenue)}</p>
              <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>Revenue</p>
            </div>
            <div style={{ borderRadius: 10, backgroundColor: profit >= 0 ? '#ECFDF5' : '#FEF2F2', padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, color: profit >= 0 ? '#047857' : '#B91C1C' }}>{pkr(profit)}</p>
              <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>Profit ({margin}%)</p>
            </div>
          </div>

          <div style={DIV} />

          {/* Sales list */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A1A1AA', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp style={{ width: 13, height: 13 }} /> Sales Today
            </p>
            {sales.length === 0 ? (
              <p style={{ fontSize: 13, color: '#A1A1AA', textAlign: 'center', padding: '16px 0' }}>No sales recorded today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sales.map((sale, i) => {
                  const sp = sale.total_sell_price - sale.total_cost_price
                  return (
                    <div key={sale.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: '#A1A1AA', width: 20, flexShrink: 0 }}>{i+1}.</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sale.customer?.name ?? 'Walk-in'}</p>
                          <p style={{ fontSize: 11, color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{salePrimaryLabel(sale)}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{pkr(sale.total_sell_price)}</p>
                        <p style={{ fontSize: 11, fontWeight: 500, color: sp >= 0 ? '#059669' : '#EF4444' }}>+{pkr(sp)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={DIV} />

          {/* Stock summary */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A1A1AA', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package style={{ width: 13, height: 13 }} /> Remaining Stock
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ border: '1px solid #F0EEE8', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A' }}>{laptopStock}</span>
                <span style={{ fontSize: 13, color: '#A1A1AA' }}>Laptops</span>
              </div>
              <div style={{ border: '1px solid #F0EEE8', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A' }}>{componentStock}</span>
                <span style={{ fontSize: 13, color: '#A1A1AA' }}>Components</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid #F0EEE8', flexShrink: 0 }}>
          <Button variant="outline" style={{ flex: 1, color: '#25D366', borderColor: 'rgba(37,211,102,0.4)' }} onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppSummary(sales,laptopStock,componentStock))}`, '_blank','noopener,noreferrer') }}>
            <MessageCircle style={{ width: 16, height: 16 }} /> Share WhatsApp
          </Button>
          <Button variant="outline" style={{ flex: 1 }} onClick={() => downloadPDF(sales, laptopStock, componentStock)}>
            <Download style={{ width: 16, height: 16 }} /> Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

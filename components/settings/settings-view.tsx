'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Store, AlertTriangle, Download, ShieldAlert, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'

type SaleRow = { id: string; sale_date: string; created_at: string; total_sell_price: number; total_cost_price: number; payment_type: string; warranty_days: number; specs_promised: string | null; notes: string | null; customer: { name: string; phone: string | null } | null; sale_items: Array<{ item_type: string; quantity: number; sell_price_snapshot: number; cost_price_snapshot: number; laptop: { brand: string; model: string } | null; component: { name: string; category: string } | null }> }
type LaptopRow = { brand: string; model: string; processor: string | null; base_ram_gb: number; base_storage_gb: number; storage_type: string; cost_price: number; sell_price: number | null; quantity: number }
type CustomerRow = { name: string; phone: string | null; sales: Array<{ total_sell_price: number }> }

const SALE_SELECT = `id, sale_date, created_at, total_sell_price, total_cost_price, payment_type, warranty_days, specs_promised, notes, customer:customers(name, phone), sale_items(item_type, quantity, sell_price_snapshot, cost_price_snapshot, laptop:laptops(brand, model), component:components(name, category))` as const

function fileDate() { const d = new Date(); return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), d.getFullYear()].join('-') }
function fmtPKR(n: number) { return n.toLocaleString('en-PK') }
function storageFmt(gb: number) { return gb >= 1024 ? `${gb/1024}TB` : `${gb}GB` }
function laptopLabel(s: SaleRow) { const l = s.sale_items.find(i => i.item_type === 'laptop')?.laptop; return l ? `${l.brand} ${l.model}` : 'Component Sale' }
function totalUnits(s: SaleRow) { return s.sale_items.reduce((sum,i) => sum + i.quantity, 0) }
function itemsList(s: SaleRow) { return s.sale_items.map(i => { const qty = i.quantity > 1 ? ` ×${i.quantity}` : ''; if (i.item_type === 'laptop') return i.laptop ? `${i.laptop.brand} ${i.laptop.model}${qty}` : ''; return i.component ? `${i.component.name}${qty}` : '' }).filter(Boolean).join(' + ') }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url) }

function buildCSV(sales: SaleRow[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const headers = ['Sale ID','Date','Time','Customer Name','Customer Phone','Items Sold','Sell (PKR)','Cost (PKR)','Profit (PKR)','Margin %','Payment','Warranty Days','Specs Promised','Notes']
  const rows = sales.map(s => {
    const sell = s.total_sell_price, cost = s.total_cost_price, profit = sell - cost
    const margin = sell > 0 ? ((profit/sell)*100).toFixed(1) : '0'
    const time = new Date(s.created_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', hour12:true })
    return [s.id, s.sale_date, time, s.customer?.name ?? 'Walk-in', s.customer?.phone ?? '', itemsList(s), sell, cost, profit, margin, s.payment_type, s.warranty_days ?? 0, s.specs_promised ?? '', s.notes ?? ''].map(esc).join(',')
  })
  return [headers.map(esc).join(','), ...rows].join('\n')
}

async function buildExcelWorkbook(sales: SaleRow[], laptops: LaptopRow[], customers: CustomerRow[]) {
  const XLSX = await import('xlsx')
  const totalSell = sales.reduce((s,r) => s+r.total_sell_price, 0), totalCost = sales.reduce((s,r) => s+r.total_cost_price, 0), totalUn = sales.reduce((s,r) => s+totalUnits(r), 0)
  const salesData = [['Date','Customer Name','Laptop Model','Units Sold','Specs Promised','Sell Price (PKR)','Cost Price (PKR)','Profit (PKR)','Margin %','Warranty'], ...sales.map(s => { const sell=s.total_sell_price, cost=s.total_cost_price, profit=sell-cost; return [s.sale_date, s.customer?.name??'Walk-in', laptopLabel(s), totalUnits(s), s.specs_promised??'', sell, cost, profit, sell>0?((profit/sell)*100).toFixed(1)+'%':'0%', s.warranty_days>0?`${s.warranty_days} days`:'None'] }), ['TOTAL','','',totalUn,'',totalSell,totalCost,totalSell-totalCost,'','']]
  const inventoryData = [['Brand','Model','Processor','RAM (GB)','Storage','Storage Type','Cost Price (PKR)','Sell Price (PKR)','Stock Qty','Total Stock Value (PKR)'], ...laptops.map(l => [l.brand, l.model, l.processor??'—', l.base_ram_gb, storageFmt(l.base_storage_gb), l.storage_type, l.cost_price, l.sell_price??'TBD', l.quantity, l.cost_price*l.quantity])]
  const customersData = [['Customer Name','Phone','Total Purchases','Total Spent (PKR)'], ...customers.map(c => [c.name, c.phone??'', c.sales?.length??0, c.sales?.reduce((sum,s) => sum+s.total_sell_price, 0)??0])]
  const wb = XLSX.utils.book_new()
  const wsSales = XLSX.utils.aoa_to_sheet(salesData); const wsInv = XLSX.utils.aoa_to_sheet(inventoryData); const wsCust = XLSX.utils.aoa_to_sheet(customersData)
  wsSales['!cols'] = [12,22,32,12,50,20,20,18,11,14].map(w => ({ wch:w })); wsInv['!cols'] = [14,24,36,11,14,14,20,20,12,24].map(w => ({ wch:w })); wsCust['!cols'] = [28,18,18,22].map(w => ({ wch:w }))
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Report'); XLSX.utils.book_append_sheet(wb, wsInv, 'Inventory'); XLSX.utils.book_append_sheet(wb, wsCust, 'Customers')
  XLSX.writeFile(wb, `FineComputers-Sales-${fileDate()}.xlsx`)
}

const DARK=[30,41,59] as [number,number,number], WHITE=[255,255,255] as [number,number,number], LIGHT=[248,250,252] as [number,number,number]
async function buildPDF(sales: SaleRow[], laptops: LaptopRow[]) {
  const { jsPDF } = await import('jspdf'); const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' })
  const W = doc.internal.pageSize.getWidth(), H_ = doc.internal.pageSize.getHeight()
  const today = new Date().toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })
  function pageHeader(label: string) { doc.setFillColor(...DARK); doc.rect(0,0,W,20,'F'); doc.setTextColor(...WHITE); doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text('Fine Computers',14,8); doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text('Trust Plaza, Sargodha  ·  '+label,14,14); doc.text(`Generated: ${today}`,W-14,14,{align:'right'}); doc.setTextColor(0,0,0) }
  const tH = { fillColor:DARK, textColor:WHITE, fontStyle:'bold' as const, fontSize:8, cellPadding:3 }, tB = { fontSize:7.5, cellPadding:2.5 }, alt = { fillColor:LIGHT }
  pageHeader('Sales Report')
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('Sales Report',14,30); doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139); doc.text(`${sales.length} transaction${sales.length!==1?'s':''}`,14,36); doc.setTextColor(0,0,0)
  const tSell=sales.reduce((s,r)=>s+r.total_sell_price,0), tCost=sales.reduce((s,r)=>s+r.total_cost_price,0), tUn=sales.reduce((s,r)=>s+totalUnits(r),0)
  const TOTS = { fontStyle:'bold' as const, fillColor:[226,232,240] as [number,number,number] }
  ;(autoTable as (d:unknown,o:unknown)=>void)(doc, { startY:40, head:[['Date','Customer','Laptop Model','Units','Sell (PKR)','Cost (PKR)','Profit (PKR)','Margin','Warranty']], body:[...sales.map(s=>{const sell=s.total_sell_price,cost=s.total_cost_price,profit=sell-cost;return[s.sale_date,s.customer?.name??'Walk-in',laptopLabel(s),String(totalUnits(s)),fmtPKR(sell),fmtPKR(cost),fmtPKR(profit),sell>0?((profit/sell)*100).toFixed(1)+'%':'0%',s.warranty_days>0?`${s.warranty_days}d`:'—']}),[ {content:'TOTAL',colSpan:3,styles:{...TOTS,halign:'right' as const}},{content:String(tUn),styles:{...TOTS,halign:'center' as const}},{content:fmtPKR(tSell),styles:{...TOTS,halign:'right' as const}},{content:fmtPKR(tCost),styles:{...TOTS,halign:'right' as const}},{content:fmtPKR(tSell-tCost),styles:{...TOTS,halign:'right' as const}},{content:'',styles:TOTS},{content:'',styles:TOTS}]], headStyles:tH, bodyStyles:tB, alternateRowStyles:alt, columnStyles:{0:{cellWidth:22},1:{cellWidth:34},2:{cellWidth:50},3:{cellWidth:14,halign:'center'},4:{cellWidth:26,halign:'right'},5:{cellWidth:26,halign:'right'},6:{cellWidth:24,halign:'right'},7:{cellWidth:14,halign:'center'},8:{cellWidth:16,halign:'center'}}, styles:{overflow:'linebreak'}, margin:{left:14,right:14} })
  doc.addPage(); pageHeader('Inventory Summary'); doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('Inventory Summary',14,30); doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139); doc.text(`${laptops.length} laptop model${laptops.length!==1?'s':''}`,14,36); doc.setTextColor(0,0,0)
  const tv=laptops.reduce((s,l)=>s+l.cost_price*l.quantity,0), ts=laptops.reduce((s,l)=>s+l.quantity,0)
  ;(autoTable as (d:unknown,o:unknown)=>void)(doc, { startY:40, head:[['Brand','Model','Processor','RAM','Storage','Cost (PKR)','Sell (PKR)','Qty','Value (PKR)']], body:[...laptops.map(l=>[l.brand,l.model,l.processor??'—',`${l.base_ram_gb}GB`,`${storageFmt(l.base_storage_gb)} ${l.storage_type}`,fmtPKR(l.cost_price),l.sell_price!==null?fmtPKR(l.sell_price):'TBD',String(l.quantity),fmtPKR(l.cost_price*l.quantity)]),[{content:'TOTAL',colSpan:7,styles:{fontStyle:'bold' as const,halign:'right' as const,fillColor:[226,232,240] as [number,number,number]}},{content:String(ts),styles:{fontStyle:'bold' as const,halign:'center' as const,fillColor:[226,232,240] as [number,number,number]}},{content:fmtPKR(tv),styles:{fontStyle:'bold' as const,halign:'right' as const,fillColor:[226,232,240] as [number,number,number]}}]], headStyles:tH, bodyStyles:tB, alternateRowStyles:alt, columnStyles:{0:{cellWidth:20},1:{cellWidth:28},2:{cellWidth:50},3:{cellWidth:13,halign:'center'},4:{cellWidth:30},5:{cellWidth:24,halign:'right'},6:{cellWidth:24,halign:'right'},7:{cellWidth:12,halign:'center'},8:{cellWidth:26,halign:'right'}}, styles:{overflow:'linebreak'}, margin:{left:14,right:14} })
  const pc = doc.getNumberOfPages(); for (let i=1;i<=pc;i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(148,163,184); doc.text(`Fine Computers  ·  Trust Plaza, Sargodha  ·  Page ${i} of ${pc}`,W/2,H_-5,{align:'center'}) }
  doc.save(`FineComputers-Report-${fileDate()}.pdf`)
}

const SECTION: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #F0EEE8', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20 }
const DIVIDER: React.CSSProperties = { height: 1, backgroundColor: '#F0EEE8', margin: '16px 0' }
const ROW: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }

export function SettingsView() {
  const supabase = useMemo(() => createClient(), [])
  const [loading,      setLoading]      = useState(true)
  const [shopName,     setShopName]     = useState('Fine Computers')
  const [shopPhone,    setShopPhone]    = useState('')
  const [shopAddress,  setShopAddress]  = useState('Trust Plaza, Sargodha')
  const [savingShop,   setSavingShop]   = useState(false)
  const [laptopMin,    setLaptopMin]    = useState(2)
  const [componentMin, setComponentMin] = useState(3)
  const [savingThresh, setSavingThresh] = useState(false)
  const [expCSV,       setExpCSV]       = useState(false)
  const [expXLSX,      setExpXLSX]      = useState(false)
  const [expPDF,       setExpPDF]       = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
        if (data) { setShopName(data.shop_name); setShopPhone(data.shop_phone ?? ''); setShopAddress(data.shop_address ?? ''); setLaptopMin(data.low_stock_laptops); setComponentMin(data.low_stock_components) }
      } catch { /* first run */ } finally { setLoading(false) }
    }
    load()
  }, [supabase])

  async function handleSaveShop() {
    if (!shopName.trim()) { toast.error('Shop name cannot be empty'); return }
    setSavingShop(true)
    try {
      const { error } = await supabase.from('settings').upsert({ id:1, shop_name:shopName.trim(), shop_phone:shopPhone.trim()||null, shop_address:shopAddress.trim()||null, updated_at:new Date().toISOString() }, { onConflict:'id' })
      if (error) throw error; toast.success('Shop info saved')
    } catch (err) { toast.error((err as { message?: string })?.message ?? 'Failed to save') } finally { setSavingShop(false) }
  }

  async function handleSaveThresholds() {
    setSavingThresh(true)
    try {
      const { error } = await supabase.from('settings').upsert({ id:1, low_stock_laptops:laptopMin, low_stock_components:componentMin, updated_at:new Date().toISOString() }, { onConflict:'id' })
      if (error) throw error; toast.success('Thresholds saved')
    } catch (err) { toast.error((err as { message?: string })?.message ?? 'Failed to save') } finally { setSavingThresh(false) }
  }

  async function handleExportCSV() {
    setExpCSV(true)
    try {
      const { data, error } = await supabase.from('sales').select(SALE_SELECT).order('sale_date', { ascending:false })
      if (error) throw error
      if (!data?.length) { toast.info('No sales records to export yet'); return }
      downloadBlob(new Blob(['﻿'+buildCSV(data as unknown as SaleRow[])], { type:'text/csv;charset=utf-8;' }), `FineComputers-Sales-${fileDate()}.csv`)
      toast.success(`${data.length} sales exported to CSV`)
    } catch (err) { toast.error((err as { message?: string })?.message ?? 'Export failed') } finally { setExpCSV(false) }
  }

  async function handleExportExcel() {
    setExpXLSX(true)
    try {
      const [sR, lR, cR] = await Promise.all([
        supabase.from('sales').select(SALE_SELECT).order('sale_date', { ascending:false }),
        supabase.from('laptops').select('*').order('brand').order('model'),
        supabase.from('customers').select('*, sales(total_sell_price)').order('name'),
      ])
      if (sR.error) throw sR.error; if (lR.error) throw lR.error; if (cR.error) throw cR.error
      await buildExcelWorkbook(sR.data as unknown as SaleRow[], lR.data as unknown as LaptopRow[], cR.data as unknown as CustomerRow[])
      toast.success(`Excel downloaded — ${sR.data!.length} sales, ${lR.data!.length} laptops, ${cR.data!.length} customers`)
    } catch (err) { toast.error((err as { message?: string })?.message ?? 'Excel export failed') } finally { setExpXLSX(false) }
  }

  async function handleExportPDF() {
    setExpPDF(true)
    try {
      const [sR, lR] = await Promise.all([supabase.from('sales').select(SALE_SELECT).order('sale_date', { ascending:false }), supabase.from('laptops').select('*').order('brand').order('model')])
      if (sR.error) throw sR.error; if (lR.error) throw lR.error
      await buildPDF(sR.data as unknown as SaleRow[], lR.data as unknown as LaptopRow[])
      toast.success('PDF report downloaded')
    } catch (err) { toast.error((err as { message?: string })?.message ?? 'PDF export failed') } finally { setExpPDF(false) }
  }

  if (loading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'96px 0' }}><Loader2 style={{ width:28, height:28, color:'#A1A1AA' }} className="fc-spin" /></div>
  }

  const Field = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div><label htmlFor={id} style={{ display:'block', fontSize:13, fontWeight:500, color:'#3F3F46', marginBottom:6 }}>{label}</label>{children}</div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Shop Info */}
      <section style={SECTION}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(249,115,22,0.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Store style={{ width:18, height:18, color:'#F97316' }} />
          </div>
          <div>
            <h2 style={{ fontSize:14, fontWeight:600, color:'#0A0A0A' }}>Shop Information</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', marginTop:2 }}>Shown on printed receipts and WhatsApp invoices</p>
          </div>
        </div>
        <div style={DIVIDER} />
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Field id="sname" label="Shop Name *"><Input id="sname" style={{ height:44 }} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Fine Computers" /></Field>
          <Field id="sphone" label="Phone Number"><Input id="sphone" style={{ height:44 }} value={shopPhone} onChange={e => setShopPhone(e.target.value)} placeholder="0300-1234567" /></Field>
          <Field id="saddr" label="Address"><Textarea id="saddr" rows={2} value={shopAddress} onChange={e => setShopAddress(e.target.value)} placeholder="Shop address" /></Field>
        </div>
        <div style={{ marginTop:16 }}>
          <Button onClick={handleSaveShop} disabled={savingShop} style={{ height:40 }}>
            {savingShop && <Loader2 style={{ width:14, height:14 }} className="fc-spin" />}
            Save Shop Info
          </Button>
        </div>
      </section>

      {/* Low Stock */}
      <section style={SECTION}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:10, backgroundColor:'#FFFBEB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AlertTriangle style={{ width:18, height:18, color:'#B45309' }} />
          </div>
          <div>
            <h2 style={{ fontSize:14, fontWeight:600, color:'#0A0A0A' }}>Low Stock Warnings</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', marginTop:2 }}>Show a warning badge when stock falls to or below this quantity</p>
          </div>
        </div>
        <div style={DIVIDER} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Field id="lmin" label="Laptops (units)"><Input id="lmin" type="number" min={0} style={{ height:44, fontSize:16 }} value={laptopMin} onChange={e => setLaptopMin(Math.max(0, Number(e.target.value)||0))} /></Field>
          <Field id="cmin" label="Components (units)"><Input id="cmin" type="number" min={0} style={{ height:44, fontSize:16 }} value={componentMin} onChange={e => setComponentMin(Math.max(0, Number(e.target.value)||0))} /></Field>
        </div>
        <p style={{ fontSize:12, color:'#A1A1AA', backgroundColor:'#F5F2EC', padding:'8px 12px', borderRadius:8, marginTop:12 }}>
          Laptops with qty ≤ <strong>{laptopMin}</strong> show &ldquo;Low stock&rdquo; · Components with qty ≤ <strong>{componentMin}</strong> show &ldquo;Low&rdquo;
        </p>
        <div style={{ marginTop:12 }}>
          <Button onClick={handleSaveThresholds} disabled={savingThresh} style={{ height:40 }}>
            {savingThresh && <Loader2 style={{ width:14, height:14 }} className="fc-spin" />}
            Save Thresholds
          </Button>
        </div>
      </section>

      {/* Danger Zone / Exports */}
      <section style={{ ...SECTION, border:'1px dashed rgba(239,68,68,0.35)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ShieldAlert style={{ width:18, height:18, color:'#EF4444' }} />
          </div>
          <div>
            <h2 style={{ fontSize:14, fontWeight:600, color:'#0A0A0A' }}>Danger Zone</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', marginTop:2 }}>Owner-only data exports</p>
          </div>
        </div>
        <div style={DIVIDER} />

        {/* CSV */}
        <div style={ROW}>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
              <Download style={{ width:15, height:15, color:'#A1A1AA', flexShrink:0 }} /> Sales CSV
            </p>
            <p style={{ fontSize:12, color:'#A1A1AA', marginTop:3, lineHeight:1.5 }}>Simple flat file — date, customer, items, prices, profit, warranty.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={expCSV||expXLSX||expPDF} style={{ flexShrink:0 }}>
            {expCSV ? <><Loader2 style={{ width:13, height:13 }} className="fc-spin" />Exporting…</> : <><Download style={{ width:13, height:13 }} />Download</>}
          </Button>
        </div>
        <div style={DIVIDER} />

        {/* Excel */}
        <div style={ROW}>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
              <FileSpreadsheet style={{ width:15, height:15, color:'#059669', flexShrink:0 }} /> Excel Report (.xlsx)
            </p>
            <p style={{ fontSize:12, color:'#A1A1AA', marginTop:3, lineHeight:1.5 }}>3 formatted sheets: <strong>Sales Report</strong> · <strong>Inventory</strong> · <strong>Customers</strong>.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={expCSV||expXLSX||expPDF} style={{ flexShrink:0, borderColor:'rgba(5,150,105,0.3)', color:'#047857' }}>
            {expXLSX ? <><Loader2 style={{ width:13, height:13 }} className="fc-spin" />Building…</> : <><FileSpreadsheet style={{ width:13, height:13 }} />Download</>}
          </Button>
        </div>
        <div style={DIVIDER} />

        {/* PDF */}
        <div style={ROW}>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
              <FileText style={{ width:15, height:15, color:'#EA580C', flexShrink:0 }} /> PDF Report (.pdf)
            </p>
            <p style={{ fontSize:12, color:'#A1A1AA', marginTop:3, lineHeight:1.5 }}>Branded landscape PDF — sales table, inventory summary. Ready to print.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={expCSV||expXLSX||expPDF} style={{ flexShrink:0, borderColor:'rgba(234,88,12,0.3)', color:'#C2410C' }}>
            {expPDF ? <><Loader2 style={{ width:13, height:13 }} className="fc-spin" />Generating…</> : <><FileText style={{ width:13, height:13 }} />Download</>}
          </Button>
        </div>
      </section>
    </div>
  )
}

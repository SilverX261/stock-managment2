import { SalesList } from '@/components/sales/sales-list'

export const metadata = { title: 'Sales — Fine Computers' }

export default function SalesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EEE8', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Sales</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>All transactions and revenue</p>
      </div>
      <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
        <SalesList />
      </div>
    </div>
  )
}

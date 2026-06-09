import { SalesList } from '@/components/sales/sales-list'

export const metadata = { title: 'Sales — Fine Computers' }

export default function SalesPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Sales</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>All transactions and revenue</p>
      </div>
      <div className="fc-page-content">
        <SalesList />
      </div>
    </div>
  )
}

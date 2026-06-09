import { CustomersList } from '@/components/customers/customers-list'

export const metadata = { title: 'Customers — Fine Computers' }

export default function CustomersPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Customers</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Customer database and purchase history</p>
      </div>
      <div className="fc-page-content">
        <CustomersList />
      </div>
    </div>
  )
}

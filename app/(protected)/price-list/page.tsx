import { PriceListView } from '@/components/price-list/price-list-view'

export const metadata = { title: 'Price List — Fine Computers' }

export default function PriceListPage() {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-header">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>Price List</h1>
        <p style={{ fontSize: '13px', color: '#A1A1AA', marginTop: 3 }}>Current laptop prices — for staff reference only</p>
      </div>
      <div className="fc-page-content">
        <PriceListView />
      </div>
    </div>
  )
}

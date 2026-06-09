import { CustomerProfile } from '@/components/customers/customer-profile'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Customer Profile — Fine Computers' }

interface Props {
  params: { id: string }
}

export default function CustomerProfilePage({ params }: Props) {
  return (
    <div className="fc-page-wrap">
      <div className="fc-page-content" style={{ paddingTop: 16 }}>
        <CustomerProfile customerId={params.id} />
      </div>
    </div>
  )
}

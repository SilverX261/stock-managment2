import { CustomerProfile } from '@/components/customers/customer-profile'

export const metadata = { title: 'Customer Profile — Fine Computers' }

interface Props {
  params: { id: string }
}

export default function CustomerProfilePage({ params }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ flex: 1, padding: '16px 24px' }}>
        <CustomerProfile customerId={params.id} />
      </div>
    </div>
  )
}

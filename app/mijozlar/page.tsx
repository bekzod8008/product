import type { Metadata } from 'next'
import { CustomersView } from '@/components/customers-view'

export const metadata: Metadata = { title: 'Mijozlar — Import Savdo' }

export default function CustomersPage() {
  return <CustomersView />
}

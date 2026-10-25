import type { Metadata } from 'next'
import { PaymentsView } from '@/components/payments-view'

export const metadata: Metadata = { title: 'To‘lovlar — Import Savdo' }

export default function PaymentsPage() {
  return <PaymentsView />
}

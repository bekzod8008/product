import type { Metadata } from 'next'
import { EditOrderView } from '@/components/orders/edit-order-view'

export const metadata: Metadata = { title: 'Tahrirlash — Import Savdo' }

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = Number(id)
  return <EditOrderView id={Number.isInteger(numericId) && numericId > 0 ? numericId : null} />
}

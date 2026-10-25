import type { Metadata } from 'next'
import { ReceiptsView } from '@/components/receipts/receipts-view'

export const metadata: Metadata = { title: 'Cheklar — Import Savdo' }

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>
}) {
  const { order } = await searchParams
  const parsed = Number(Array.isArray(order) ? order[0] : order)
  return <ReceiptsView initialOrderId={Number.isInteger(parsed) && parsed > 0 ? parsed : null} />
}

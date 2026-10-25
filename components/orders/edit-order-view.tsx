'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState, PageHeader } from '@/components/common'
import { OrderForm } from './order-form'
import { useOrder } from '@/lib/hooks'

export function EditOrderView({ id }: { id: number | null }) {
  const order = useOrder(id)

  if (order === undefined) return <LoadingState />
  if (order === null) {
    return (
      <EmptyState
        title="Buyurtma topilmadi"
        description="U o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
        action={
          <Button variant="outline" render={<Link href="/mahsulotlar" />} nativeButton={false}>
            Mahsulotlarga qaytish
          </Button>
        }
      />
    )
  }

  return (
    <>
      <PageHeader title="Buyurtmani tahrirlash" description={`ID: ${order.orderId}`} />
      <OrderForm key={order.id} order={order} />
    </>
  )
}

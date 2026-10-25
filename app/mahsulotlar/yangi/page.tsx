import type { Metadata } from 'next'
import { PageHeader } from '@/components/common'
import { OrderForm } from '@/components/orders/order-form'

export const metadata: Metadata = { title: 'Mahsulot qo‘shish — Import Savdo' }

export default function NewOrderPage() {
  return (
    <>
      <PageHeader title="Mahsulot qo‘shish" description="Yangi buyurtma ma’lumotlarini kiriting." />
      <OrderForm />
    </>
  )
}

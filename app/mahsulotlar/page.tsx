import type { Metadata } from 'next'
import { ProductsView } from '@/components/orders/products-view'

export const metadata: Metadata = { title: 'Mahsulotlar — Import Savdo' }

export default function ProductsPage() {
  return <ProductsView />
}

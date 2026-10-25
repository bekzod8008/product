import type { Metadata } from 'next'
import { SearchView } from '@/components/search-view'

export const metadata: Metadata = { title: 'ID orqali qidirish — Import Savdo' }

export default function SearchPage() {
  return <SearchView />
}

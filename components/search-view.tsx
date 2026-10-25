'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, Loader2, Pencil, Printer, Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, OrderImage, PageHeader, Panel, PaymentBadge } from '@/components/common'
import { useOrderDetails } from '@/components/order-details/order-details-provider'
import { useOrder } from '@/lib/hooks'
import { computeTotal, fullName } from '@/lib/calc'
import { formatDate, formatUZS } from '@/lib/format'
import { findOrderByOrderId } from '@/lib/repository'

type SearchState = { status: 'idle' } | { status: 'found'; id: number } | { status: 'missing'; query: string }

export function SearchView() {
  const { openOrder } = useOrderDetails()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [state, setState] = useState<SearchState>({ status: 'idle' })
  const order = useOrder(state.status === 'found' ? state.id : null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setSearching(true)
    try {
      const found = await findOrderByOrderId(trimmed)
      setState(found ? { status: 'found', id: found.id } : { status: 'missing', query: trimmed })
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <PageHeader title="ID orqali qidirish" description="Mahsulot ID raqamini kiriting. Katta-kichik harf farq qilmaydi." />

      <form onSubmit={handleSubmit} className="mb-5 flex max-w-xl gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="masalan: IMP-1024"
            aria-label="Mahsulot ID"
            className="pl-8 font-mono"
            autoFocus
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={searching || !query.trim()}>
          {searching && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Qidirish
        </Button>
      </form>

      {state.status === 'missing' && (
        <Panel className="max-w-xl">
          <EmptyState
            icon={SearchX}
            title="Mahsulot topilmadi"
            description={`"${state.query}" ID bilan buyurtma mavjud emas.`}
          />
        </Panel>
      )}

      {state.status === 'found' && order === null && (
        <Panel className="max-w-xl">
          <EmptyState icon={SearchX} title="Mahsulot topilmadi" description="Bu buyurtma o‘chirilgan." />
        </Panel>
      )}

      {state.status === 'found' && order && (
        <Panel className="max-w-xl p-4">
          <div className="flex gap-4">
            <OrderImage image={order.image} alt={order.productName} className="size-24" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">{order.orderId}</p>
              <h2 className="truncate text-base font-semibold">{order.productName}</h2>
              <p className="text-sm text-muted-foreground">
                {fullName(order)}
                {order.phone && ` · ${order.phone}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-primary">{formatUZS(computeTotal(order))}</span>
                <span className="text-xs text-muted-foreground">
                  {order.quantity} × {formatUZS(order.unitPrice)} · {formatDate(order.orderDate)}
                </span>
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => openOrder(order.id)}>
              <Eye data-icon="inline-start" />
              Batafsil
            </Button>
            <Button variant="outline" size="sm" render={<Link href={`/mahsulotlar/${order.id}/tahrirlash`} />} nativeButton={false}>
              <Pencil data-icon="inline-start" />
              Tahrirlash
            </Button>
            <Button variant="outline" size="sm" render={<Link href={`/cheklar?order=${order.id}`} />} nativeButton={false}>
              <Printer data-icon="inline-start" />
              Chek chiqarish
            </Button>
          </div>
        </Panel>
      )}
    </>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, LoadingState, OrderImage, PageHeader, Panel, PaymentBadge, SegmentedFilter } from '@/components/common'
import { useOrderDetails } from '@/components/order-details/order-details-provider'
import { DeleteOrderDialog } from './delete-order-dialog'
import { useOrders } from '@/lib/hooks'
import { computeTotal, fullName, matchesText } from '@/lib/calc'
import { formatNumber, formatUZS } from '@/lib/format'
import type { StoredOrder } from '@/lib/types'

type StatusFilter = 'all' | 'paid' | 'unpaid'
type SortKey = 'createdAt' | 'orderId' | 'productName' | 'customer' | 'unitPrice' | 'quantity' | 'total' | 'status'

const sortValue: Record<SortKey, (o: StoredOrder) => string | number> = {
  createdAt: (o) => o.createdAt,
  orderId: (o) => o.orderIdKey,
  productName: (o) => o.productName.toLowerCase(),
  customer: (o) => fullName(o).toLowerCase(),
  unitPrice: (o) => o.unitPrice,
  quantity: (o) => o.quantity,
  total: (o) => computeTotal(o),
  status: (o) => o.paymentStatus,
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  align = 'left',
}: {
  label: string
  column: SortKey
  sort: { key: SortKey; dir: 'asc' | 'desc' }
  onSort: (key: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead
      className={align === 'right' ? 'text-right' : undefined}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? 'text-foreground' : ''}`}
      >
        {label}
        <Icon className="size-3" aria-hidden="true" />
      </button>
    </TableHead>
  )
}

export function ProductsView() {
  const orders = useOrders()
  const { openOrder } = useOrderDetails()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' })
  const [toDelete, setToDelete] = useState<StoredOrder | null>(null)

  const visible = useMemo(() => {
    if (!orders) return []
    const filtered = orders.filter(
      (o) =>
        (status === 'all' || o.paymentStatus === status) &&
        matchesText([o.orderId, o.productName, fullName(o)], query),
    )
    const get = sortValue[sort.key]
    return filtered.sort((a, b) => {
      const av = get(a)
      const bv = get(b)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'uz')
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [orders, query, status, sort])

  function handleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  return (
    <>
      <PageHeader
        title="Mahsulotlar"
        description={orders ? `Jami ${orders.length} ta buyurtma` : undefined}
        actions={
          <Button render={<Link href="/mahsulotlar/yangi" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Mahsulot qo‘shish
          </Button>
        }
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ID, mahsulot yoki mijoz nomi"
            aria-label="Mahsulotlarni qidirish"
            className="pl-8"
          />
        </div>
        <SegmentedFilter
          label="To‘lov holati bo‘yicha filtr"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Barchasi' },
            { value: 'paid', label: 'To‘langan' },
            { value: 'unpaid', label: 'To‘lanmagan' },
          ]}
        />
      </div>

      <Panel>
        {orders === undefined ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Hali mahsulot qo‘shilmagan"
            description="Birinchi buyurtmani qo‘shing — u shu yerda ko‘rinadi."
            action={
              <Button render={<Link href="/mahsulotlar/yangi" />} nativeButton={false} size="sm">
                <Plus data-icon="inline-start" />
                Mahsulot qo‘shish
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState icon={Search} title="Hech narsa topilmadi" description="Qidiruv yoki filtrni o‘zgartirib ko‘ring." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">Rasm</span>
                </TableHead>
                <SortHeader label="ID" column="orderId" sort={sort} onSort={handleSort} />
                <SortHeader label="Mahsulot nomi" column="productName" sort={sort} onSort={handleSort} />
                <SortHeader label="Mijoz" column="customer" sort={sort} onSort={handleSort} />
                <SortHeader label="Bir dona narxi" column="unitPrice" sort={sort} onSort={handleSort} align="right" />
                <SortHeader label="Soni" column="quantity" sort={sort} onSort={handleSort} align="right" />
                <SortHeader label="Jami narx" column="total" sort={sort} onSort={handleSort} align="right" />
                <SortHeader label="To‘lov holati" column="status" sort={sort} onSort={handleSort} />
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => openOrder(order.id)}>
                  <TableCell>
                    <OrderImage image={order.image} alt={order.productName} className="size-9" />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <button
                      type="button"
                      className="hover:text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        openOrder(order.id)
                      }}
                    >
                      {order.orderId}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium">{order.productName}</TableCell>
                  <TableCell className="max-w-40 truncate">{fullName(order)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatUZS(order.unitPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(order.quantity)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatUZS(computeTotal(order))}</TableCell>
                  <TableCell>
                    <PaymentBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/mahsulotlar/${order.id}/tahrirlash`} />}
                        nativeButton={false}
                        aria-label={`${order.orderId} ni tahrirlash`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToDelete(order)}
                        aria-label={`${order.orderId} ni o‘chirish`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <DeleteOrderDialog order={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </>
  )
}

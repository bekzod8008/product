'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState, LoadingState, OrderImage, PageHeader, Panel, PaymentBadge } from '@/components/common'
import { useOrderDetails } from '@/components/order-details/order-details-provider'
import { useOrders } from '@/lib/hooks'
import { computeTotal, groupCustomers, matchesText } from '@/lib/calc'
import { formatDate, formatNumber, formatUZS } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Customer } from '@/lib/types'

function CustomerOrders({ customer }: { customer: Customer }) {
  const { openOrder } = useOrderDetails()
  return (
    <ul className="divide-y border-t bg-muted/30">
      {customer.orders.map((order) => (
        <li key={order.id}>
          <button
            type="button"
            onClick={() => openOrder(order.id)}
            className="flex w-full items-center gap-3 px-4 py-2 pl-10 text-left hover:bg-muted"
          >
            <OrderImage image={order.image} alt={order.productName} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{order.productName}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{order.orderId}</span> · {formatDate(order.orderDate)} · {order.quantity} dona
              </p>
            </div>
            <span className="text-sm tabular-nums">{formatUZS(computeTotal(order))}</span>
            <PaymentBadge status={order.paymentStatus} className="hidden sm:inline-flex" />
          </button>
        </li>
      ))}
    </ul>
  )
}

export function CustomersView() {
  const orders = useOrders()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const customers = useMemo(() => (orders ? groupCustomers(orders) : undefined), [orders])
  const visible = useMemo(
    () => customers?.filter((c) => matchesText([c.displayName, c.phone], query)) ?? [],
    [customers, query],
  )

  return (
    <>
      <PageHeader
        title="Mijozlar"
        description="Buyurtmalar mijoz ismi va familiyasi bo‘yicha guruhlanadi. Bir xil ismli, lekin turli telefonli mijozlar alohida ko‘rsatiladi."
      />

      <div className="relative mb-3 sm:w-80">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, familiya yoki telefon"
          aria-label="Mijozlarni qidirish"
          className="pl-8"
        />
      </div>

      <Panel>
        {customers === undefined ? (
          <LoadingState />
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="Hali mijozlar yo‘q" description="Buyurtma qo‘shilganda mijozlar avtomatik paydo bo‘ladi." />
        ) : visible.length === 0 ? (
          <EmptyState icon={Search} title="Mijoz topilmadi" />
        ) : (
          <>
            <div className="hidden grid-cols-[1fr_8rem_9rem_9rem] gap-4 border-b px-4 py-2 pl-10 text-xs font-medium text-muted-foreground sm:grid">
              <span>Mijoz</span>
              <span className="text-right">Buyurtmalar</span>
              <span className="text-right">Umumiy summa</span>
              <span className="text-right">Qarzdorlik</span>
            </div>
            <ul className="divide-y">
              {visible.map((customer) => {
                const isOpen = expanded === customer.key
                return (
                  <li key={customer.key}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : customer.key)}
                      aria-expanded={isOpen}
                      className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2 px-4 py-2.5 text-left hover:bg-muted/50 sm:grid-cols-[auto_1fr_8rem_9rem_9rem] sm:gap-x-4"
                    >
                      <ChevronRight
                        className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{customer.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{customer.phone || 'Telefon kiritilmagan'}</p>
                      </div>
                      <span className="text-right text-sm tabular-nums sm:block">
                        {formatNumber(customer.orderCount)}
                        <span className="sm:hidden"> ta</span>
                      </span>
                      <span className="col-start-2 text-xs text-muted-foreground tabular-nums sm:col-start-auto sm:text-right sm:text-sm sm:text-foreground">
                        <span className="sm:hidden">Jami: </span>
                        {formatUZS(customer.totalAmount)}
                      </span>
                      <span
                        className={cn(
                          'col-start-2 text-xs tabular-nums sm:col-start-auto sm:text-right sm:text-sm',
                          customer.outstanding > 0 ? 'font-medium text-destructive' : 'text-success',
                        )}
                      >
                        <span className="sm:hidden">Qarz: </span>
                        {formatUZS(customer.outstanding)}
                      </span>
                    </button>
                    {isOpen && <CustomerOrders customer={customer} />}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Panel>
    </>
  )
}

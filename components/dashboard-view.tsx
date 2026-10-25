'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Package, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState, OrderImage, PageHeader, Panel, PaymentBadge, StatItem } from '@/components/common'
import { useOrderDetails } from '@/components/order-details/order-details-provider'
import { useOrders } from '@/lib/hooks'
import { computeTotal, fullName, groupCustomers, summarizePayments } from '@/lib/calc'
import { formatDate, formatNumber, formatUZS } from '@/lib/format'

export function DashboardView() {
  const orders = useOrders()
  const { openOrder } = useOrderDetails()

  const stats = useMemo(() => {
    if (!orders) return null
    return { summary: summarizePayments(orders), customers: groupCustomers(orders).length }
  }, [orders])

  const recent = orders?.slice(0, 6) ?? []

  return (
    <>
      <PageHeader
        title="Bosh sahifa"
        description="Buyurtmalar va to‘lovlar bo‘yicha umumiy ko‘rinish."
        actions={
          <>
            <Button variant="outline" render={<Link href="/qidiruv" />} nativeButton={false}>
              <Search data-icon="inline-start" />
              ID orqali qidirish
            </Button>
            <Button render={<Link href="/mahsulotlar/yangi" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              Mahsulot qo‘shish
            </Button>
          </>
        }
      />

      {!stats || !orders ? (
        <LoadingState />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatItem label="Buyurtmalar" value={formatNumber(stats.summary.count)} />
            <StatItem label="Mijozlar" value={formatNumber(stats.customers)} />
            <StatItem label="Umumiy summa" value={formatUZS(stats.summary.total)} tone="primary" />
            <StatItem label="To‘langan" value={formatUZS(stats.summary.paid)} tone="success" />
            <StatItem label="Qarzdorlik" value={formatUZS(stats.summary.unpaid)} tone="danger" />
          </div>

          <Panel>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-medium">So‘nggi buyurtmalar</h2>
              <Link href="/mahsulotlar" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Barchasi
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Hali buyurtma yo‘q"
                description="Birinchi mahsulotni qo‘shib boshlang."
              />
            ) : (
              <ul className="divide-y">
                {recent.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => openOrder(order.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50"
                    >
                      <OrderImage image={order.image} alt={order.productName} className="size-9" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{order.productName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="font-mono">{order.orderId}</span> · {fullName(order)} ·{' '}
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium tabular-nums">{formatUZS(computeTotal(order))}</span>
                        <PaymentBadge status={order.paymentStatus} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  )
}

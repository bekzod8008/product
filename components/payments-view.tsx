'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, LoadingState, PageHeader, Panel, PaymentBadge, SegmentedFilter, StatItem } from '@/components/common'
import { useOrderDetails } from '@/components/order-details/order-details-provider'
import { useOrders } from '@/lib/hooks'
import { computeTotal, fullName, summarizePayments } from '@/lib/calc'
import { formatDate, formatNumber, formatUZS, paymentLabels } from '@/lib/format'
import { setPaymentStatus } from '@/lib/repository'
import type { StoredOrder } from '@/lib/types'

type Filter = 'all' | 'paid' | 'unpaid'

export function PaymentsView() {
  const orders = useOrders()
  const { openOrder } = useOrderDetails()
  const [filter, setFilter] = useState<Filter>('unpaid')
  const [pendingId, setPendingId] = useState<number | null>(null)

  const summary = useMemo(() => (orders ? summarizePayments(orders) : null), [orders])
  const visible = useMemo(
    () => orders?.filter((o) => filter === 'all' || o.paymentStatus === filter) ?? [],
    [orders, filter],
  )

  async function toggle(order: StoredOrder) {
    const next = order.paymentStatus === 'paid' ? 'unpaid' : 'paid'
    setPendingId(order.id)
    try {
      await setPaymentStatus(order.id, next)
      toast.success(`${order.orderId}: ${paymentLabels[next]}`)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <PageHeader title="To‘lovlar" description="To‘lov holatini kuzatish va o‘zgartirish." />

      {!summary ? (
        <LoadingState />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatItem label={`Umumiy summa · ${formatNumber(summary.count)} ta`} value={formatUZS(summary.total)} tone="primary" />
            <StatItem label={`To‘langan · ${formatNumber(summary.paidCount)} ta`} value={formatUZS(summary.paid)} tone="success" />
            <StatItem label={`To‘lanmagan · ${formatNumber(summary.unpaidCount)} ta`} value={formatUZS(summary.unpaid)} tone="danger" />
          </div>

          <div className="mb-3">
            <SegmentedFilter
              label="To‘lov holati bo‘yicha filtr"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'unpaid', label: 'To‘lanmagan' },
                { value: 'paid', label: 'To‘langan' },
                { value: 'all', label: 'Barchasi' },
              ]}
            />
          </div>

          <Panel>
            {visible.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={filter === 'unpaid' ? 'Qarzdorlik yo‘q' : 'Buyurtmalar yo‘q'}
                description={filter === 'unpaid' ? 'Barcha buyurtmalar to‘langan.' : undefined}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Mahsulot</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Jami narx</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => openOrder(order.id)}>
                      <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                      <TableCell className="max-w-48 truncate">{order.productName}</TableCell>
                      <TableCell className="max-w-40 truncate">{fullName(order)}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(order.orderDate)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatUZS(computeTotal(order))}</TableCell>
                      <TableCell>
                        <PaymentBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={order.paymentStatus === 'paid' ? 'outline' : 'default'}
                          disabled={pendingId === order.id}
                          onClick={() => toggle(order)}
                        >
                          {order.paymentStatus === 'paid' ? 'To‘lanmagan deb belgilash' : 'To‘landi'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </>
      )}
    </>
  )
}

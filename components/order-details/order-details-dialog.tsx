'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeftRight, Pencil, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingState, OrderImage, PaymentBadge } from '@/components/common'
import { useOrder } from '@/lib/hooks'
import { computeTotal, fullName } from '@/lib/calc'
import { formatDate, formatDateTime, formatUZS, paymentLabels } from '@/lib/format'
import { setPaymentStatus } from '@/lib/repository'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-1.5 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  )
}

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const order = useOrder(orderId)
  const [saving, setSaving] = useState(false)

  async function togglePayment() {
    if (!order) return
    const next = order.paymentStatus === 'paid' ? 'unpaid' : 'paid'
    setSaving(true)
    try {
      await setPaymentStatus(order.id, next)
      toast.success(`To‘lov holati: ${paymentLabels[next]}`)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function navigate(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {order === undefined ? (
          <>
            <DialogTitle className="sr-only">Buyurtma tafsilotlari</DialogTitle>
            <LoadingState />
          </>
        ) : order === null ? (
          <DialogHeader>
            <DialogTitle>Buyurtma topilmadi</DialogTitle>
            <DialogDescription>Bu buyurtma o‘chirilgan bo‘lishi mumkin.</DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{order.productName}</DialogTitle>
              <DialogDescription>
                ID: <span className="font-mono text-foreground">{order.orderId}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 sm:flex-row">
              <OrderImage image={order.image} alt={order.productName} className="aspect-square w-full sm:size-36" />
              <dl className="min-w-0 flex-1 text-sm">
                <Row label="Bir dona narxi">{formatUZS(order.unitPrice)}</Row>
                <Row label="Soni">{order.quantity}</Row>
                <Row label="Jami narx">
                  <span className="text-primary">{formatUZS(computeTotal(order))}</span>
                </Row>
                <Row label="To‘lov holati">
                  <PaymentBadge status={order.paymentStatus} />
                </Row>
              </dl>
            </div>

            <dl className="text-sm">
              <Row label="Mijoz">{fullName(order)}</Row>
              
<Row label="Telefon">
  {order.phone ? (
    <a
      href={`https://t.me/${order.phone.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#168ac0] active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21.9 4.6 18.6 20c-.25 1.1-.9 1.35-1.85.85l-5.1-3.75-2.45 2.35c-.27.27-.5.5-1 .5l.35-5.2 9.45-8.55c.4-.35-.1-.55-.6-.2L5.75 13.4.7 11.8c-1.1-.35-1.1-1.1.25-1.6L20.7 2.6c.9-.3 1.65.2 1.2 2Z" />
      </svg>
      Telegram
    </a>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</Row>

              <Row label="Buyurtma sanasi">{formatDate(order.orderDate)}</Row>
              <Row label="Qo‘shilgan">{formatDateTime(order.createdAt)}</Row>
              <Row label="Yangilangan">{formatDateTime(order.updatedAt)}</Row>
            </dl>

            {order.notes && (
              <div className="rounded-md border bg-muted/40 p-2.5 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">Izoh</p>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            <DialogFooter className="flex-wrap">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Yopish
              </Button>
              <Button variant="outline" onClick={() => navigate(`/cheklar?order=${order.id}`)}>
                <Printer data-icon="inline-start" />
                Chek chiqarish
              </Button>
              <Button variant="outline" onClick={togglePayment} disabled={saving}>
                <ArrowLeftRight data-icon="inline-start" />
                To‘lovni o‘zgartirish
              </Button>
              <Button onClick={() => navigate(`/mahsulotlar/${order.id}/tahrirlash`)}>
                <Pencil data-icon="inline-start" />
                Tahrirlash
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteOrder } from '@/lib/repository'
import type { StoredOrder } from '@/lib/types'

export function DeleteOrderDialog({
  order,
  onOpenChange,
}: {
  order: StoredOrder | null
  onOpenChange: (open: boolean) => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    if (!order) return
    setDeleting(true)
    try {
      await deleteOrder(order.id)
      toast.success(`"${order.orderId}" o‘chirildi`)
      onOpenChange(false)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={order !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buyurtmani o‘chirasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            {order ? (
              <>
                <span className="font-mono">{order.orderId}</span> — {order.productName}. Bu amalni ortga qaytarib
                bo‘lmaydi. Bog‘liq chek ham o‘chiriladi.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={deleting}>
            {deleting && <Loader2 className="animate-spin" data-icon="inline-start" />}
            O‘chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

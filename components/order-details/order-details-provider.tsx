'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { OrderDetailsDialog } from './order-details-dialog'

interface OrderDetailsContextValue {
  openOrder: (id: number) => void
}

const OrderDetailsContext = createContext<OrderDetailsContextValue | null>(null)

export function OrderDetailsProvider({ children }: { children: React.ReactNode }) {
  const [orderId, setOrderId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const openOrder = useCallback((id: number) => {
    setOrderId(id)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openOrder }), [openOrder])

  return (
    <OrderDetailsContext.Provider value={value}>
      {children}
      <OrderDetailsDialog orderId={orderId} open={open} onOpenChange={setOpen} />
    </OrderDetailsContext.Provider>
  )
}

export function useOrderDetails(): OrderDetailsContextValue {
  const ctx = useContext(OrderDetailsContext)
  if (!ctx) throw new Error('useOrderDetails must be used within OrderDetailsProvider')
  return ctx
}

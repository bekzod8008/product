'use client'

import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { DEFAULT_SETTINGS } from './repository'
import type { Settings, StoredOrder, StoredReceipt } from './types'

export function useOrders(): StoredOrder[] | undefined {
  return useLiveQuery(
    async () => (await db.orders.orderBy('createdAt').reverse().toArray()) as StoredOrder[],
    [],
  )
}

export function useOrder(id: number | null): StoredOrder | null | undefined {
  return useLiveQuery(async () => {
    if (id == null) return null
    return ((await db.orders.get(id)) as StoredOrder | undefined) ?? null
  }, [id])
}

export function useReceipts(): StoredReceipt[] | undefined {
  return useLiveQuery(
    async () => (await db.receipts.orderBy('createdAt').reverse().toArray()) as StoredReceipt[],
    [],
  )
}

export function useReceiptForOrder(orderDbId: number | null): StoredReceipt | null | undefined {
  return useLiveQuery(async () => {
    if (orderDbId == null) return null
    return ((await db.receipts.where('orderDbId').equals(orderDbId).first()) as StoredReceipt | undefined) ?? null
  }, [orderDbId])
}

export function useSettings(): { settings: Settings; loading: boolean } {
  const stored = useLiveQuery(async () => (await db.settings.get('app')) ?? null, [])
  return {
    settings: { ...DEFAULT_SETTINGS, ...(stored ?? {}) },
    loading: stored === undefined,
  }
}

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

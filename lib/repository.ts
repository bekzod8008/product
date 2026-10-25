import { db } from './db'
import { collapseSpaces } from './calc'
import { backupSchema, type BackupFile } from './schemas'
import { blobToDataUrl, dataUrlToBlob } from './image'
import type { OrderInput, PaymentStatus, Receipt, Settings, StoredOrder, StoredReceipt } from './types'

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export const DEFAULT_SETTINGS: Settings = {
  key: 'app',
  storeName: 'Do‘kon',
  phone: '',
  address: '',
  receiptFooter: 'Xaridingiz uchun rahmat!',
  paperSize: 'thermal',
}

export function toOrderIdKey(orderId: string): string {
  return orderId.trim().toUpperCase()
}

function translateError(error: unknown): RepositoryError {
  if (error instanceof RepositoryError) return error
  const inner = (error as { inner?: unknown })?.inner
  if (inner instanceof RepositoryError) return inner
  const name = (error as { name?: string })?.name ?? ''
  if (name === 'ConstraintError' || name.includes('Constraint')) {
    return new RepositoryError('Bu ID bilan buyurtma allaqachon mavjud')
  }
  if (name === 'QuotaExceededError' || name.includes('Quota')) {
    return new RepositoryError('Brauzer xotirasi to‘lgan. Eski ma’lumotlarni o‘chiring yoki zaxira oling.')
  }
  console.error('[storage]', error)
  return new RepositoryError('Ma’lumotni saqlashda xatolik yuz berdi')
}

async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw translateError(error)
  }
}

function sanitizeOrder(input: OrderInput): OrderInput {
  return {
    ...input,
    orderId: input.orderId.trim(),
    productName: collapseSpaces(input.productName),
    customerFirstName: collapseSpaces(input.customerFirstName),
    customerLastName: collapseSpaces(input.customerLastName),
    phone: input.phone.trim(),
    notes: input.notes.trim(),
    unitPrice: Math.round(input.unitPrice),
    quantity: Math.round(input.quantity),
  }
}

export function createOrder(input: OrderInput): Promise<number> {
  const data = sanitizeOrder(input)
  const orderIdKey = toOrderIdKey(data.orderId)
  return run(() =>
    db.transaction('rw', db.orders, async () => {
      const existing = await db.orders.where('orderIdKey').equals(orderIdKey).first()
      if (existing) throw new RepositoryError(`"${data.orderId}" ID allaqachon mavjud`)
      const now = Date.now()
      return (await db.orders.add({ ...data, orderIdKey, createdAt: now, updatedAt: now })) as number
    }),
  )
}

export function updateOrder(id: number, input: OrderInput): Promise<void> {
  const data = sanitizeOrder(input)
  const orderIdKey = toOrderIdKey(data.orderId)
  return run(() =>
    db.transaction('rw', db.orders, async () => {
      const current = await db.orders.get(id)
      if (!current) throw new RepositoryError('Buyurtma topilmadi')
      const duplicate = await db.orders.where('orderIdKey').equals(orderIdKey).first()
      if (duplicate && duplicate.id !== id) {
        throw new RepositoryError(`"${data.orderId}" ID boshqa buyurtmada ishlatilgan`)
      }
      await db.orders.update(id, { ...data, orderIdKey, updatedAt: Date.now() })
    }),
  )
}

export function deleteOrder(id: number): Promise<void> {
  return run(() =>
    db.transaction('rw', db.orders, db.receipts, async () => {
      await db.receipts.where('orderDbId').equals(id).delete()
      await db.orders.delete(id)
    }),
  )
}

export function setPaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<void> {
  return run(async () => {
    const updated = await db.orders.update(id, { paymentStatus, updatedAt: Date.now() })
    if (!updated) throw new RepositoryError('Buyurtma topilmadi')
  })
}

export function findOrderByOrderId(orderId: string): Promise<StoredOrder | undefined> {
  const key = toOrderIdKey(orderId)
  if (!key) return Promise.resolve(undefined)
  return run(async () => (await db.orders.where('orderIdKey').equals(key).first()) as StoredOrder | undefined)
}

export function isOrderIdTaken(orderId: string, exceptId?: number): Promise<boolean> {
  return run(async () => {
    const found = await db.orders.where('orderIdKey').equals(toOrderIdKey(orderId)).first()
    return Boolean(found && found.id !== exceptId)
  })
}

export function formatReceiptNo(seq: number): string {
  return `CHK-${String(seq).padStart(6, '0')}`
}

/** One receipt per order: reuses the existing record and only bumps its print counter. */
export function recordReceiptPrint(orderDbId: number): Promise<StoredReceipt> {
  return run(() =>
    db.transaction('rw', db.orders, db.receipts, async () => {
      const order = await db.orders.get(orderDbId)
      if (!order) throw new RepositoryError('Buyurtma topilmadi')
      const now = Date.now()
      const existing = await db.receipts.where('orderDbId').equals(orderDbId).first()
      if (existing) {
        const next = { ...existing, lastPrintedAt: now, printCount: existing.printCount + 1 }
        await db.receipts.put(next)
        return next as StoredReceipt
      }
      const last = await db.receipts.orderBy('seq').last()
      const seq = (last?.seq ?? 0) + 1
      const receipt: Receipt = {
        seq,
        receiptNo: formatReceiptNo(seq),
        orderDbId,
        createdAt: now,
        lastPrintedAt: now,
        printCount: 1,
      }
      const id = (await db.receipts.add(receipt)) as number
      return { ...receipt, id }
    }),
  )
}

export function saveSettings(values: Omit<Settings, 'key'>): Promise<void> {
  return run(async () => {
    await db.settings.put({ ...values, key: 'app' })
  })
}

export async function exportBackup(): Promise<BackupFile> {
  const [orders, receipts, settings] = await run(() =>
    db.transaction('r', db.orders, db.receipts, db.settings, () =>
      Promise.all([db.orders.toArray(), db.receipts.toArray(), db.settings.get('app')]),
    ),
  )

  const serializedOrders = await Promise.all(
    orders.map(async ({ orderIdKey: _key, image, ...order }) => ({
      ...order,
      id: order.id as number,
      image: image ? await blobToDataUrl(image) : null,
    })),
  )

  return {
    app: 'import-savdo',
    version: 1,
    exportedAt: Date.now(),
    orders: serializedOrders,
    receipts: receipts.map((r) => ({ ...r, id: r.id as number })),
    settings: settings
      ? {
          storeName: settings.storeName,
          phone: settings.phone,
          address: settings.address,
          receiptFooter: settings.receiptFooter,
          paperSize: settings.paperSize,
        }
      : null,
  }
}

export function parseBackup(raw: unknown): BackupFile {
  const result = backupSchema.safeParse(raw)
  if (!result.success) {
    throw new RepositoryError('Zaxira fayli noto‘g‘ri formatda yoki buzilgan')
  }
  const keys = new Set<string>()
  const ids = new Set<number>()
  for (const order of result.data.orders) {
    const key = toOrderIdKey(order.orderId)
    if (keys.has(key)) throw new RepositoryError(`Zaxirada takrorlangan ID bor: "${order.orderId}"`)
    if (ids.has(order.id)) throw new RepositoryError('Zaxirada takrorlangan ichki ID bor')
    keys.add(key)
    ids.add(order.id)
  }
  return result.data
}

export async function importBackup(backup: BackupFile): Promise<void> {
  const orderIds = new Set(backup.orders.map((o) => o.id))
  const orders = await Promise.all(
    backup.orders.map(async (order) => ({
      ...order,
      orderIdKey: toOrderIdKey(order.orderId),
      image: order.image ? await dataUrlToBlob(order.image) : null,
    })),
  )
  const seenReceiptOrders = new Set<number>()
  const receipts = backup.receipts.filter((r) => {
    if (!orderIds.has(r.orderDbId) || seenReceiptOrders.has(r.orderDbId)) return false
    seenReceiptOrders.add(r.orderDbId)
    return true
  })

  await run(() =>
    db.transaction('rw', db.orders, db.receipts, db.settings, async () => {
      await Promise.all([db.orders.clear(), db.receipts.clear()])
      await db.orders.bulkAdd(orders)
      await db.receipts.bulkAdd(receipts)
      if (backup.settings) await db.settings.put({ ...backup.settings, key: 'app' })
    }),
  )
}

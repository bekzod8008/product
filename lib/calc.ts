import type { Customer, Order, PaymentSummary, StoredOrder } from './types'

export function computeTotal(order: Pick<Order, 'unitPrice' | 'quantity'>): number {
  const price = Number.isFinite(order.unitPrice) ? order.unitPrice : 0
  const qty = Number.isFinite(order.quantity) ? order.quantity : 0
  return Math.round(price * qty)
}

export function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeName(value: string): string {
  return collapseSpaces(value)
    .replace(/[‘’ʻʼ`´]/g, "'")
    .toLowerCase()
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 9 ? digits.slice(-9) : digits
}

export function fullName(order: Pick<Order, 'customerFirstName' | 'customerLastName'>): string {
  return collapseSpaces(`${order.customerFirstName} ${order.customerLastName}`)
}

export function summarizePayments(orders: Order[]): PaymentSummary {
  const summary: PaymentSummary = { count: 0, paidCount: 0, unpaidCount: 0, total: 0, paid: 0, unpaid: 0 }
  for (const order of orders) {
    const total = computeTotal(order)
    summary.count += 1
    summary.total += total
    if (order.paymentStatus === 'paid') {
      summary.paidCount += 1
      summary.paid += total
    } else {
      summary.unpaidCount += 1
      summary.unpaid += total
    }
  }
  return summary
}

const byNewest = (a: StoredOrder, b: StoredOrder) =>
  b.orderDate.localeCompare(a.orderDate) || b.createdAt - a.createdAt

function buildCustomer(key: string, orders: StoredOrder[]): Customer {
  const sorted = [...orders].sort(byNewest)
  const newest = sorted[0]
  const summary = summarizePayments(sorted)
  return {
    key,
    displayName: fullName(newest),
    phone: sorted.find((o) => o.phone.trim())?.phone.trim() ?? '',
    orders: sorted,
    orderCount: summary.count,
    totalAmount: summary.total,
    paidAmount: summary.paid,
    outstanding: summary.unpaid,
  }
}

/**
 * Orders are grouped by normalized first + last name. When the same name appears
 * with different phone numbers, each phone becomes a separate customer; orders
 * without a phone stay with the name only if it is unambiguous.
 */
export function groupCustomers(orders: StoredOrder[]): Customer[] {
  const byName = new Map<string, StoredOrder[]>()
  for (const order of orders) {
    const nameKey = `${normalizeName(order.customerFirstName)}|${normalizeName(order.customerLastName)}`
    const list = byName.get(nameKey)
    if (list) list.push(order)
    else byName.set(nameKey, [order])
  }

  const customers: Customer[] = []
  for (const [nameKey, nameOrders] of byName) {
    const phones = new Set(nameOrders.map((o) => normalizePhone(o.phone)).filter(Boolean))
    if (phones.size <= 1) {
      customers.push(buildCustomer(`${nameKey}|${[...phones][0] ?? ''}`, nameOrders))
      continue
    }
    const byPhone = new Map<string, StoredOrder[]>()
    for (const order of nameOrders) {
      const phone = normalizePhone(order.phone)
      const list = byPhone.get(phone)
      if (list) list.push(order)
      else byPhone.set(phone, [order])
    }
    for (const [phone, phoneOrders] of byPhone) {
      customers.push(buildCustomer(`${nameKey}|${phone}`, phoneOrders))
    }
  }

  return customers.sort((a, b) => a.displayName.localeCompare(b.displayName, 'uz'))
}

export function matchesText(haystack: string[], query: string): boolean {
  const q = normalizeName(query)
  if (!q) return true
  return haystack.some((value) => normalizeName(value).includes(q))
}

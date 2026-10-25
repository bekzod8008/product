export type PaymentStatus = 'paid' | 'unpaid'

export type PaperSize = 'a4' | 'thermal'

export interface Order {
  id?: number
  orderId: string
  orderIdKey: string
  productName: string
  customerFirstName: string
  customerLastName: string
  phone: string
  unitPrice: number
  quantity: number
  orderDate: string
  notes: string
  paymentStatus: PaymentStatus
  image: Blob | null
  createdAt: number
  updatedAt: number
}

export type StoredOrder = Order & { id: number }

export type OrderInput = Omit<Order, 'id' | 'orderIdKey' | 'createdAt' | 'updatedAt'>

export interface Customer {
  key: string
  displayName: string
  phone: string
  orders: StoredOrder[]
  orderCount: number
  totalAmount: number
  paidAmount: number
  outstanding: number
}

export interface Receipt {
  id?: number
  seq: number
  receiptNo: string
  orderDbId: number
  createdAt: number
  lastPrintedAt: number
  printCount: number
}

export type StoredReceipt = Receipt & { id: number }

export interface Settings {
  key: 'app'
  storeName: string
  phone: string
  address: string
  receiptFooter: string
  paperSize: PaperSize
}

export interface PaymentSummary {
  count: number
  paidCount: number
  unpaidCount: number
  total: number
  paid: number
  unpaid: number
}

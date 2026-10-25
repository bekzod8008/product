import Dexie, { type EntityTable } from 'dexie'
import type { Order, Receipt, Settings } from './types'

class AppDatabase extends Dexie {
  orders!: EntityTable<Order, 'id'>
  receipts!: EntityTable<Receipt, 'id'>
  settings!: EntityTable<Settings, 'key'>

  constructor() {
    super('import-savdo-db')
    this.version(1).stores({
      orders: '++id, &orderIdKey, paymentStatus, createdAt, orderDate',
      receipts: '++id, &seq, &orderDbId, createdAt',
      settings: 'key',
    })
  }
}

export const db = new AppDatabase()

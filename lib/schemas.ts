import { z } from 'zod'

const requiredText = (message: string, max = 120) =>
  z.string().trim().min(1, message).max(max, `Ko‘pi bilan ${max} ta belgi`)

const moneyNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value
    const cleaned = value.replace(/[\s,]/g, '')
    return cleaned === '' ? Number.NaN : Number(cleaned)
  }, schema)

export const orderFormSchema = z.object({
  orderId: requiredText('ID kiritilishi shart', 40).regex(
    /^[A-Za-z0-9\-_/.]+$/,
    'ID faqat lotin harflari, raqamlar va - _ / . belgilaridan iborat bo‘lishi mumkin',
  ),
  productName: requiredText('Mahsulot nomini kiriting'),
  customerFirstName: requiredText('Mijoz ismini kiriting', 60),
  customerLastName: requiredText('Mijoz familiyasini kiriting', 60),
  phone: z
    .string()
    .trim()
    .max(20, 'Telefon raqami juda uzun')
    .refine((v) => v === '' || /^\+?[0-9\s\-()]{7,20}$/.test(v), 'Telefon raqami noto‘g‘ri'),
  unitPrice: moneyNumber(
    z
      .number({ error: 'Narxni kiriting' })
      .int('Narx butun son bo‘lishi kerak')
      .positive('Narx 0 dan katta bo‘lishi kerak')
      .max(1_000_000_000_000, 'Narx juda katta'),
  ),
  quantity: moneyNumber(
    z
      .number({ error: 'Sonini kiriting' })
      .int('Soni butun son bo‘lishi kerak')
      .min(1, 'Soni kamida 1 bo‘lishi kerak')
      .max(1_000_000, 'Soni juda katta'),
  ),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Buyurtma sanasini kiriting'),
  notes: z.string().trim().max(1000, 'Izoh juda uzun'),
  paymentStatus: z.enum(['paid', 'unpaid']),
})

export type OrderFormValues = z.output<typeof orderFormSchema>

export const settingsSchema = z.object({
  storeName: requiredText('Do‘kon nomini kiriting', 80),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(200),
  receiptFooter: z.string().trim().max(300),
  paperSize: z.enum(['a4', 'thermal']),
})

export type SettingsFormValues = z.output<typeof settingsSchema>

const backupOrderSchema = z.object({
  id: z.number().int().positive(),
  orderId: z.string().trim().min(1).max(40),
  productName: z.string().min(1).max(200),
  customerFirstName: z.string().min(1).max(100),
  customerLastName: z.string().min(1).max(100),
  phone: z.string().max(40).default(''),
  unitPrice: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).default(''),
  paymentStatus: z.enum(['paid', 'unpaid']),
  image: z
    .string()
    .regex(/^data:image\/[a-z+.-]+;base64,/i)
    .nullable()
    .default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const backupReceiptSchema = z.object({
  id: z.number().int().positive(),
  seq: z.number().int().positive(),
  receiptNo: z.string().min(1),
  orderDbId: z.number().int().positive(),
  createdAt: z.number(),
  lastPrintedAt: z.number(),
  printCount: z.number().int().nonnegative(),
})

export const backupSchema = z.object({
  app: z.literal('import-savdo'),
  version: z.literal(1),
  exportedAt: z.number(),
  orders: z.array(backupOrderSchema),
  receipts: z.array(backupReceiptSchema).default([]),
  settings: settingsSchema.nullable().default(null),
})

export type BackupFile = z.output<typeof backupSchema>
export type BackupOrder = z.output<typeof backupOrderSchema>

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}

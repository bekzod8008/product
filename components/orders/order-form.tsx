'use client'

import { useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError, Panel, SegmentedFilter } from '@/components/common'
import { computeTotal } from '@/lib/calc'
import { formatUZS, todayISO } from '@/lib/format'
import { useObjectUrl } from '@/lib/hooks'
import { prepareImage } from '@/lib/image'
import { createOrder, isOrderIdTaken, updateOrder } from '@/lib/repository'
import { fieldErrors, orderFormSchema } from '@/lib/schemas'
import type { PaymentStatus, StoredOrder } from '@/lib/types'

interface FormState {
  orderId: string
  productName: string
  customerFirstName: string
  customerLastName: string
  phone: string
  unitPrice: string
  quantity: string
  orderDate: string
  notes: string
  paymentStatus: PaymentStatus
}

function initialState(order?: StoredOrder): FormState {
  return {
    orderId: order?.orderId ?? '',
    productName: order?.productName ?? '',
    customerFirstName: order?.customerFirstName ?? '',
    customerLastName: order?.customerLastName ?? '',
    phone: order?.phone ?? '',
    unitPrice: order ? String(order.unitPrice) : '',
    quantity: order ? String(order.quantity) : '1',
    orderDate: order?.orderDate ?? todayISO(),
    notes: order?.notes ?? '',
    paymentStatus: order?.paymentStatus ?? 'unpaid',
  }
}

function toNumber(value: string): number {
  const n = Number(value.replace(/[\s,]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function OrderForm({ order }: { order?: StoredOrder }) {
  const router = useRouter()
  const formId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<FormState>(() => initialState(order))
  const [image, setImage] = useState<Blob | null>(order?.image ?? null)
  const [imageBusy, setImageBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const previewUrl = useObjectUrl(image)
  const isEdit = Boolean(order)

  const total = computeTotal({ unitPrice: toNumber(values.unitPrice), quantity: toNumber(values.quantity) })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  async function checkDuplicateId() {
    const id = values.orderId.trim()
    if (!id) return
    try {
      if (await isOrderIdTaken(id, order?.id)) {
        setErrors((prev) => ({ ...prev, orderId: `"${id}" ID allaqachon mavjud` }))
      }
    } catch {
      // The authoritative check runs again on submit.
    }
  }

  async function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImageBusy(true)
    try {
      setImage(await prepareImage(file))
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setImageBusy(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = orderFormSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      toast.error('Formadagi xatolarni tuzating')
      return
    }
    setSubmitting(true)
    try {
      const input = { ...parsed.data, image }
      if (order) {
        await updateOrder(order.id, input)
        toast.success('Buyurtma yangilandi')
      } else {
        await createOrder(input)
        toast.success('Buyurtma qo‘shildi')
      }
      router.push('/mahsulotlar')
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('ID')) setErrors((prev) => ({ ...prev, orderId: message }))
      toast.error(message)
      setSubmitting(false)
    }
  }

  const field = (key: keyof FormState) => ({
    id: `${formId}-${key}`,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${formId}-${key}-error` : undefined,
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Panel className="grid gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-orderId`}>Mahsulot ID *</Label>
            <Input
              {...field('orderId')}
              value={values.orderId}
              onChange={(e) => update('orderId', e.target.value)}
              onBlur={checkDuplicateId}
              placeholder="masalan: IMP-1024"
              autoComplete="off"
              className="font-mono"
            />
            <FieldError id={`${formId}-orderId-error`} message={errors.orderId} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-productName`}>Mahsulot nomi *</Label>
            <Input
              {...field('productName')}
              value={values.productName}
              onChange={(e) => update('productName', e.target.value)}
            />
            <FieldError id={`${formId}-productName-error`} message={errors.productName} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-customerFirstName`}>Mijoz ismi *</Label>
            <Input
              {...field('customerFirstName')}
              value={values.customerFirstName}
              onChange={(e) => update('customerFirstName', e.target.value)}
              autoComplete="off"
            />
            <FieldError id={`${formId}-customerFirstName-error`} message={errors.customerFirstName} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-customerLastName`}>Mijoz familiyasi *</Label>
            <Input
              {...field('customerLastName')}
              value={values.customerLastName}
              onChange={(e) => update('customerLastName', e.target.value)}
              autoComplete="off"
            />
            <FieldError id={`${formId}-customerLastName-error`} message={errors.customerLastName} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-phone`}>Telefon raqami</Label>
            <Input
              {...field('phone')}
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+998 90 123 45 67"
            />
            <FieldError id={`${formId}-phone-error`} message={errors.phone} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-orderDate`}>Buyurtma sanasi *</Label>
            <Input
              {...field('orderDate')}
              type="date"
              value={values.orderDate}
              onChange={(e) => update('orderDate', e.target.value)}
            />
            <FieldError id={`${formId}-orderDate-error`} message={errors.orderDate} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-unitPrice`}>Bir dona narxi (so‘m) *</Label>
            <Input
              {...field('unitPrice')}
              inputMode="numeric"
              value={values.unitPrice}
              onChange={(e) => update('unitPrice', e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder="0"
              className="tabular-nums"
            />
            <FieldError id={`${formId}-unitPrice-error`} message={errors.unitPrice} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-quantity`}>Soni *</Label>
            <Input
              {...field('quantity')}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={values.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              className="tabular-nums"
            />
            <FieldError id={`${formId}-quantity-error`} message={errors.quantity} />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${formId}-notes`}>Izoh</Label>
          <Textarea
            {...field('notes')}
            rows={3}
            value={values.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
          <FieldError id={`${formId}-notes-error`} message={errors.notes} />
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">To‘lov holati</span>
          <div>
            <SegmentedFilter
              label="To‘lov holati"
              value={values.paymentStatus}
              onChange={(v) => update('paymentStatus', v)}
              options={[
                { value: 'unpaid', label: 'To‘lanmagan' },
                { value: 'paid', label: 'To‘langan' },
              ]}
            />
          </div>
        </div>
      </Panel>

      <div className="grid content-start gap-4">
        <Panel className="grid gap-3 p-4">
          <span className="text-sm font-medium">Mahsulot rasmi</span>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted">
            {imageBusy ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Rasm tayyorlanmoqda" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={previewUrl} alt="Rasm ko‘rinishi" className="size-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">Rasm tanlanmagan</span>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} tabIndex={-1} aria-hidden="true" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus data-icon="inline-start" />
              {image ? 'Almashtirish' : 'Rasm yuklash'}
            </Button>
            {image && (
              <Button type="button" variant="outline" size="icon" onClick={() => setImage(null)} aria-label="Rasmni olib tashlash">
                <Trash2 />
              </Button>
            )}
          </div>
        </Panel>

        <Panel className="grid gap-1 p-4">
          <span className="text-xs text-muted-foreground">Jami narx</span>
          <span className="text-xl font-semibold tabular-nums text-primary" aria-live="polite">
            {formatUZS(total)}
          </span>
          <span className="text-xs text-muted-foreground">Bir dona narxi × soni</span>
        </Panel>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" render={<Link href="/mahsulotlar" />} nativeButton={false}>
            Bekor qilish
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting || imageBusy}>
            {submitting && <Loader2 className="animate-spin" data-icon="inline-start" />}
            {isEdit ? 'Saqlash' : 'Qo‘shish'}
          </Button>
        </div>
      </div>
    </form>
  )
}

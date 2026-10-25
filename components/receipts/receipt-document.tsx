import { computeTotal, fullName } from '@/lib/calc'
import { formatDate, formatDateTime, formatUZS, paymentLabels } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PaperSize, Settings, StoredOrder, StoredReceipt } from '@/lib/types'

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', bold && 'font-bold')}>
      <span>{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  )
}

export function ReceiptDocument({
  order,
  receipt,
  settings,
  paperSize,
}: {
  order: StoredOrder
  receipt: StoredReceipt | null
  settings: Settings
  paperSize: PaperSize
}) {
  const thermal = paperSize === 'thermal'
  const total = computeTotal(order)
  const divider = <div className="my-2 border-t border-dashed border-black" aria-hidden="true" />

  return (
    <article
      className={cn(
        'receipt-paper mx-auto border shadow-sm',
        thermal ? 'w-[72mm] p-[3mm] text-[11px] leading-snug' : 'w-full max-w-[180mm] p-8 text-sm leading-relaxed',
      )}
      aria-label="Chek"
    >
      <header className="text-center">
        <p className={cn('font-bold', thermal ? 'text-sm' : 'text-xl')}>{settings.storeName}</p>
        {settings.address && <p>{settings.address}</p>}
        {settings.phone && <p>Tel: {settings.phone}</p>}
      </header>

      {divider}

      <Line label="Chek №" value={receipt?.receiptNo ?? '—'} bold />
      <Line label="Sana" value={formatDateTime(receipt?.lastPrintedAt ?? Date.now())} />
      <Line label="Buyurtma ID" value={order.orderId} />
      <Line label="Buyurtma sanasi" value={formatDate(order.orderDate)} />

      {divider}

      <Line label="Mijoz" value={fullName(order)} />
      {order.phone && <Line label="Telefon" value={order.phone} />}

      {divider}

      <p className="font-bold break-words">{order.productName}</p>
      <Line label={`${order.quantity} × ${formatUZS(order.unitPrice)}`} value={formatUZS(total)} />

      {divider}

      <div className={cn(thermal ? 'text-sm' : 'text-lg')}>
        <Line label="JAMI" value={formatUZS(total)} bold />
      </div>
      <Line label="To‘lov holati" value={paymentLabels[order.paymentStatus]} />

      {order.notes && (
        <>
          {divider}
          <p className="whitespace-pre-wrap break-words">Izoh: {order.notes}</p>
        </>
      )}

      {settings.receiptFooter && (
        <>
          {divider}
          <p className="text-center whitespace-pre-wrap">{settings.receiptFooter}</p>
        </>
      )}
      {receipt && receipt.printCount > 1 && (
        <p className="mt-2 text-center text-[10px]">Nusxa #{receipt.printCount}</p>
      )}
    </article>
  )
}

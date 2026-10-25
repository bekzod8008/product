'use client'

import { useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Printer, Receipt, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, LoadingState, PageHeader, Panel, PaymentBadge, SegmentedFilter } from '@/components/common'
import { ReceiptDocument } from './receipt-document'
import { useOrders, useReceipts, useSettings } from '@/lib/hooks'
import { computeTotal, fullName, matchesText } from '@/lib/calc'
import { formatDateTime, formatUZS } from '@/lib/format'
import { recordReceiptPrint } from '@/lib/repository'
import { cn } from '@/lib/utils'
import type { PaperSize, StoredReceipt } from '@/lib/types'

const pageRules: Record<PaperSize, string> = {
  thermal: '@page { size: 80mm auto; margin: 4mm; }',
  a4: '@page { size: A4; margin: 15mm; }',
}

export function ReceiptsView({ initialOrderId }: { initialOrderId: number | null }) {
  const orders = useOrders()
  const receipts = useReceipts()
  const { settings, loading: settingsLoading } = useSettings()
  const [selectedId, setSelectedId] = useState<number | null>(initialOrderId)
  const [query, setQuery] = useState('')
  const [paperOverride, setPaperOverride] = useState<PaperSize | null>(null)
  const [printing, setPrinting] = useState(false)
  const [freshReceipt, setFreshReceipt] = useState<StoredReceipt | null>(null)

  const paperSize = paperOverride ?? settings.paperSize
  const ordersById = useMemo(() => new Map(orders?.map((o) => [o.id, o]) ?? []), [orders])
  const receiptsByOrder = useMemo(() => new Map(receipts?.map((r) => [r.orderDbId, r]) ?? []), [receipts])

  const selectedOrder = selectedId != null ? ordersById.get(selectedId) : undefined
  const storedReceipt = selectedId != null ? (receiptsByOrder.get(selectedId) ?? null) : null
  const receipt = freshReceipt && freshReceipt.orderDbId === selectedId ? freshReceipt : storedReceipt

  const matches = useMemo(
    () =>
      query.trim() && orders
        ? orders.filter((o) => matchesText([o.orderId, o.productName, fullName(o)], query)).slice(0, 8)
        : [],
    [orders, query],
  )

  function select(id: number) {
    setSelectedId(id)
    setFreshReceipt(null)
    setQuery('')
  }

  async function handlePrint() {
    if (!selectedOrder) return
    setPrinting(true)
    try {
      const saved = await recordReceiptPrint(selectedOrder.id)
      flushSync(() => setFreshReceipt(saved))
      window.print()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPrinting(false)
    }
  }

  const loading = orders === undefined || receipts === undefined || settingsLoading

  return (
    <>
      <style>{pageRules[paperSize]}</style>
      <div className="print:hidden">
        <PageHeader title="Cheklar" description="Buyurtma uchun chek yarating va chop eting. Har bir buyurtmaga bitta chek raqami beriladi." />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,22rem)]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <div className="relative sm:w-80">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buyurtmani tanlash: ID yoki nom"
                  aria-label="Chek uchun buyurtma qidirish"
                  className="pl-8"
                />
                {matches.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md" role="listbox">
                    {matches.map((o) => (
                      <li key={o.id} role="option" aria-selected={o.id === selectedId}>
                        <button
                          type="button"
                          onClick={() => select(o.id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-mono text-xs">{o.orderId}</span> · {o.productName}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">{formatUZS(computeTotal(o))}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedOrder && (
                <div className="flex items-center gap-2">
                  <SegmentedFilter
                    label="Qog‘oz o‘lchami"
                    value={paperSize}
                    onChange={setPaperOverride}
                    options={[
                      { value: 'thermal', label: '80 mm' },
                      { value: 'a4', label: 'A4' },
                    ]}
                  />
                  <Button onClick={handlePrint} disabled={printing}>
                    {printing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
                    Chop etish
                  </Button>
                </div>
              )}
            </div>

            {selectedOrder ? (
              <div className="rounded-lg border bg-muted/40 p-4 print:border-0 print:bg-white print:p-0">
                <div id="print-area">
                  <ReceiptDocument order={selectedOrder} receipt={receipt} settings={settings} paperSize={paperSize} />
                </div>
                {!receipt && (
                  <p className="mt-3 text-center text-xs text-muted-foreground print:hidden">
                    Chek raqami birinchi chop etishda beriladi.
                  </p>
                )}
              </div>
            ) : (
              <Panel>
                <EmptyState
                  icon={Receipt}
                  title={selectedId != null ? 'Buyurtma topilmadi' : 'Buyurtma tanlanmagan'}
                  description="Yuqoridagi qidiruv orqali buyurtmani tanlang yoki buyurtma oynasidan “Chek chiqarish” tugmasini bosing."
                />
              </Panel>
            )}
          </div>

          <Panel className="h-fit print:hidden">
            <h2 className="border-b px-4 py-3 text-sm font-medium">Chop etilgan cheklar</h2>
            {receipts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Hali chek chop etilmagan.</p>
            ) : (
              <ul className="max-h-[60dvh] divide-y overflow-y-auto">
                {receipts.map((r) => {
                  const o = ordersById.get(r.orderDbId)
                  if (!o) return null
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => select(o.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-muted/50',
                          o.id === selectedId && 'bg-primary/5',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-medium">{r.receiptNo}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {o.orderId} · {formatDateTime(r.lastPrintedAt)}
                            {r.printCount > 1 && ` · ${r.printCount} marta`}
                          </p>
                        </div>
                        <PaymentBadge status={o.paymentStatus} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  )
}

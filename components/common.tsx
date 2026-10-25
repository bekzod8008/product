'use client'

import { ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paymentLabels } from '@/lib/format'
import { useObjectUrl } from '@/lib/hooks'
import type { PaymentStatus } from '@/lib/types'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        status === 'paid'
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
        className,
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', status === 'paid' ? 'bg-success' : 'bg-destructive')}
        aria-hidden="true"
      />
      {paymentLabels[status]}
    </span>
  )
}

export function OrderImage({
  image,
  alt,
  className,
}: {
  image: Blob | null | undefined
  alt: string
  className?: string
}) {
  const url = useObjectUrl(image)
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground',
        className ?? 'size-10',
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL from IndexedDB
        <img src={url} alt={alt} className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-4" aria-label="Rasm yo‘q" />
      )}
    </div>
  )
}

export function LoadingState({ label = 'Yuklanmoqda...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      {Icon && <Icon className="size-6 text-muted-foreground" />}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Panel({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('rounded-lg border bg-card', className)} {...props} />
}

export function StatItem({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success' | 'danger' | 'primary'
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 truncate text-lg font-semibold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-destructive',
          tone === 'primary' && 'text-primary',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function SegmentedFilter<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border bg-muted/50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
            value === option.value
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  )
}

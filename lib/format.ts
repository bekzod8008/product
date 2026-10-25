const numberFormatter = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 })

const pad = (n: number) => String(n).padStart(2, '0')

export function formatNumber(value: number): string {
  return numberFormatter.format(value).replace(/[\u00A0\u202F]/g, ' ')
}

export function formatUZS(value: number): string {
  return `${formatNumber(value)} so‘m`
}

export function formatDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  return `${match[3]}.${match[2]}.${match[1]}`
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const paymentLabels = {
  paid: 'To‘langan',
  unpaid: 'To‘lanmagan',
} as const

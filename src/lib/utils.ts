import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names while resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-IN')

/** Format an amount in Nepalese Rupees, e.g. `NPR 1,25,000`. */
export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

/** Format a plain number with Indian/Nepali digit grouping. */
export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

/** Format an ISO date string as `12 Nov 2026`. */
export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Format an ISO date string as `12 Nov`. */
export function formatShortDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date)
}

/** Extract up to two initials from a display name. */
export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

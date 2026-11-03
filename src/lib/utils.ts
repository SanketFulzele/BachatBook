import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names while resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('en-IN')

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
})

/**
 * Format an amount in Indian Rupees, e.g. `₹1,25,000` or `₹1,25,000.50`.
 * Bachat Book operates in India: currency INR, locale en-IN, timezone Asia/Kolkata.
 */
export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

/** Format a plain number with Indian digit grouping. */
export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

/** Format an ISO date string as `12 Nov 2026` in Asia/Kolkata. */
export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return dateFormatter.format(date)
}

/** Format an ISO date string as `12 Nov` in Asia/Kolkata. */
export function formatShortDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return shortDateFormatter.format(date)
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

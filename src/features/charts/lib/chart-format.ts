const compactCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/**
 * Compact rupee label for chart axes, e.g. `₹20K`, `₹1.3L`, `₹1.3Cr`.
 * Tooltips always use the full Indian currency format.
 */
export function formatAxisCurrency(value: number): string {
  return `₹${compactCurrencyFormatter.format(value)}`
}

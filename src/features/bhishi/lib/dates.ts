/** Date helpers pinned to India, matching the app's currency and timezone. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Current month in the `YYYY-MM` shape used by `<input type="month">`. */
export function currentMonthISO(): string {
  return todayISO().slice(0, 7)
}

/**
 * The first collection date inside a month: the chosen collection day, clamped
 * to the last valid day (for example day 31 in February).
 */
export function cycleStartDate(month: string, collectionDay: number): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return ''
  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5, 7))
  if (!year || monthNumber < 1 || monthNumber > 12) return ''
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const day = Math.min(Math.max(collectionDay, 1), lastDay)
  return `${month}-${String(day).padStart(2, '0')}`
}

export function cycleDefaultName(groupName: string, year?: number): string {
  const resolvedYear =
    year ??
    Number(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
      }).format(new Date()),
    )
  return `${groupName} ${resolvedYear}`
}

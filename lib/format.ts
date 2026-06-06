import { parseTime } from '@/lib/business-day'

export function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

// Currency-aware formatter. Defaults to PHP (the original single-tenant
// behaviour); pass an org's currency to format per-organisation.
export function formatCurrency(amount: number, currency = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount)
}

// Render a UTC instant as wall-clock time. Pass the venue's IANA timezone so it
// reads correctly in server components, which otherwise format in the runtime's
// timezone (UTC on Vercel) rather than the venue's local time.
export function formatTime(dateStr: string, timezone?: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  })
}

// Format a wall-clock "HH:MM" (or "HH:MM:SS") string as 12-hour time, e.g. "5:00 PM".
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// A close time that is at or before the open time rolls into the next calendar day.
export function closesNextDay(openTime: string, closeTime: string): boolean {
  return parseTime(closeTime) <= parseTime(openTime)
}

// Invalid schedule: a same-day close that lands at or before the open time —
// the venue would close before (or exactly when) it opens. Only meaningful when
// the user has said the close does NOT roll into the next day.
export function isInvalidSameDayClose(
  openTime: string,
  closeTime: string,
  closesNextDayFlag: boolean,
): boolean {
  return !closesNextDayFlag && parseTime(closeTime) <= parseTime(openTime)
}

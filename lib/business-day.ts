// Business-day attribution.
//
// A bar that opens at 17:00 and closes at 03:00 runs one trading night across
// two calendar dates. Revenue must stay on the day the night *opened*, so any
// wall-clock time before open_time is attributed to the previous calendar date.
// All math is done in the org's IANA timezone via Intl (DST-safe), so no date
// library is needed.

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

// Minutes since local midnight for a "HH:MM" (or "HH:MM:SS") string.
export function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

// Minutes since local midnight for a UTC instant, as seen in the given timezone.
export function localMinutes(tsUtc: string, timezone: string): number {
  return localParts(tsUtc, timezone).minutes
}

// Wall-clock parts of a UTC instant, as seen in the given timezone.
function localParts(tsUtc: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(tsUtc))

  const get = (type: string) => parts.find((p) => p.type === type)!.value
  let hour = Number(get('hour'))
  if (hour === 24) hour = 0 // some runtimes emit '24' for midnight

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    minutes: hour * 60 + Number(get('minute')),
  }
}

// Add (or subtract) whole days to a "YYYY-MM-DD" key, handling month/year rollover.
export function addDays(dayKey: string, n: number): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return toKey(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

// The business-day key a UTC timestamp belongs to.
export function businessDay(tsUtc: string, timezone: string, openTime: string): string {
  const { year, month, day, minutes } = localParts(tsUtc, timezone)
  const key = toKey(year, month, day)
  return minutes < parseTime(openTime) ? addDays(key, -1) : key
}

// The business day "now" falls into — used for default range and "today".
export function businessDayNow(timezone: string, openTime: string): string {
  return businessDay(new Date().toISOString(), timezone, openTime)
}

// A UTC window guaranteed to contain every timestamp that buckets into
// [startDay, endDay]. Padded generously (timezone offset + open-time shift can
// each be up to ~24h); callers re-filter precisely with businessDay().
const PAD_MS = 48 * 60 * 60 * 1000

export function rangeToUtcBounds(
  startDay: string,
  endDay: string,
): { startUtc: string; endUtc: string } {
  const start = new Date(`${startDay}T00:00:00.000Z`).getTime() - PAD_MS
  const end = new Date(`${endDay}T00:00:00.000Z`).getTime() + PAD_MS
  return { startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString() }
}

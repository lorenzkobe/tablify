import { describe, it, expect } from 'vitest'
import { businessDay, businessDayNow, addDays, rangeToUtcBounds } from '@/lib/business-day'

describe('businessDay', () => {
  const tz = 'Asia/Manila' // UTC+8, no DST
  const open = '17:00'

  it('attributes a 1am drink to the day the night opened', () => {
    // 2026-06-05 01:00 Manila = 2026-06-04 17:00 UTC
    expect(businessDay('2026-06-04T17:00:00Z', tz, open)).toBe('2026-06-04')
  })

  it('attributes an early-evening drink to the same calendar day', () => {
    // 2026-06-04 18:00 Manila = 2026-06-04 10:00 UTC
    expect(businessDay('2026-06-04T10:00:00Z', tz, open)).toBe('2026-06-04')
  })

  it('treats exactly open_time as the start of that day', () => {
    // 2026-06-04 17:00 Manila = 2026-06-04 09:00 UTC
    expect(businessDay('2026-06-04T09:00:00Z', tz, open)).toBe('2026-06-04')
  })

  it('attributes just before open_time to the previous day', () => {
    // 2026-06-04 16:59 Manila = 2026-06-04 08:59 UTC
    expect(businessDay('2026-06-04T08:59:00Z', tz, open)).toBe('2026-06-03')
  })

  it('rolls month boundaries correctly', () => {
    // 2026-07-01 01:00 Manila = 2026-06-30 17:00 UTC
    expect(businessDay('2026-06-30T17:00:00Z', tz, open)).toBe('2026-06-30')
  })

  it('handles a non-midnight-crossing venue', () => {
    // open 09:00; 2026-06-04 10:00 Manila = 2026-06-04 02:00 UTC -> same day
    expect(businessDay('2026-06-04T02:00:00Z', tz, '09:00')).toBe('2026-06-04')
  })

  it('is DST-safe for a zone that observes DST', () => {
    // New York EDT (UTC-4) in June, open 18:00.
    // 11pm NY 2026-06-04 = 2026-06-05 03:00 UTC -> 23:00 >= 18:00 -> same day
    expect(businessDay('2026-06-05T03:00:00Z', 'America/New_York', '18:00')).toBe('2026-06-04')
    // 1am NY 2026-06-05 = 2026-06-05 05:00 UTC -> before 18:00 -> previous day
    expect(businessDay('2026-06-05T05:00:00Z', 'America/New_York', '18:00')).toBe('2026-06-04')
  })
})

describe('businessDayNow', () => {
  it('returns a YYYY-MM-DD key', () => {
    expect(businessDayNow('Asia/Manila', '17:00')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('addDays', () => {
  it('adds and subtracts across month boundaries', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01')
    expect(addDays('2026-06-01', -1)).toBe('2026-05-31')
    expect(addDays('2026-06-04', 0)).toBe('2026-06-04')
  })
})

describe('rangeToUtcBounds', () => {
  it('produces a UTC window that strictly contains the business-day range', () => {
    const { startUtc, endUtc } = rangeToUtcBounds('2026-06-04', '2026-06-04')
    expect(new Date(startUtc).getTime()).toBeLessThan(new Date('2026-06-04T00:00:00Z').getTime())
    expect(new Date(endUtc).getTime()).toBeGreaterThan(new Date('2026-06-05T00:00:00Z').getTime())
  })
})

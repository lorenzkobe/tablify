import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatDistanceToNow, formatCurrency, formatTime } from '@/lib/format'

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-04T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns "just now" for timestamps under 1 minute ago', () => {
    const ts = new Date('2026-06-04T11:59:30Z').toISOString()
    expect(formatDistanceToNow(ts)).toBe('just now')
  })

  it('returns minutes for timestamps under 1 hour ago', () => {
    const ts = new Date('2026-06-04T11:45:00Z').toISOString()
    expect(formatDistanceToNow(ts)).toBe('15m ago')
  })

  it('returns hours for timestamps under 24 hours ago', () => {
    const ts = new Date('2026-06-04T10:00:00Z').toISOString()
    expect(formatDistanceToNow(ts)).toBe('2h ago')
  })

  it('returns days for timestamps over 24 hours ago', () => {
    const ts = new Date('2026-06-02T12:00:00Z').toISOString()
    expect(formatDistanceToNow(ts)).toBe('2d ago')
  })
})

describe('formatCurrency', () => {
  it('formats whole peso amounts', () => {
    expect(formatCurrency(14)).toBe('₱14.00')
  })

  it('formats decimal amounts', () => {
    expect(formatCurrency(13.5)).toBe('₱13.50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₱0.00')
  })
})

describe('formatTime', () => {
  it('returns a formatted time string', () => {
    const ts = '2026-06-04T14:30:00Z'
    const result = formatTime(ts)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

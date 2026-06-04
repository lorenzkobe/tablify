import { describe, it, expect } from 'vitest'
import {
  NEXT_ITEM_STATUS,
  PREV_ITEM_STATUS,
  QUEUE_STATUSES,
  isValidTransition,
} from '@/lib/order-status'

describe('item status flow', () => {
  it('advances forward one step at a time', () => {
    expect(NEXT_ITEM_STATUS.ordered).toBe('in_progress')
    expect(NEXT_ITEM_STATUS.in_progress).toBe('ready')
    expect(NEXT_ITEM_STATUS.ready).toBe('served')
    expect(NEXT_ITEM_STATUS.served).toBeUndefined()
  })

  it('reverts backward one step at a time', () => {
    expect(PREV_ITEM_STATUS.served).toBe('ready')
    expect(PREV_ITEM_STATUS.ready).toBe('in_progress')
    expect(PREV_ITEM_STATUS.in_progress).toBe('ordered')
    expect(PREV_ITEM_STATUS.ordered).toBeUndefined()
  })

  it('keeps unfinished items on the queue board', () => {
    expect(QUEUE_STATUSES).toEqual(['ordered', 'in_progress', 'ready'])
    expect(QUEUE_STATUSES).not.toContain('served')
    expect(QUEUE_STATUSES).not.toContain('returned')
  })
})

describe('isValidTransition', () => {
  it('allows single forward steps', () => {
    expect(isValidTransition('ordered', 'in_progress')).toBe(true)
    expect(isValidTransition('ready', 'served')).toBe(true)
  })

  it('allows single backward steps (revert)', () => {
    expect(isValidTransition('ready', 'in_progress')).toBe(true)
    expect(isValidTransition('served', 'ready')).toBe(true)
  })

  it('rejects skips and no-ops', () => {
    expect(isValidTransition('ordered', 'ready')).toBe(false)
    expect(isValidTransition('ordered', 'served')).toBe(false)
    expect(isValidTransition('ordered', 'ordered')).toBe(false)
    expect(isValidTransition('served', 'ordered')).toBe(false)
  })
})

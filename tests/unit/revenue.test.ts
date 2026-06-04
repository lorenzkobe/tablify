import { describe, it, expect } from 'vitest'
import { revenueOfItems, aggregateRevenue, type RevenueRow } from '@/lib/revenue'

const tz = 'Asia/Manila'
const open = '17:00'

describe('revenueOfItems', () => {
  it('sums quantity * unit_price', () => {
    expect(
      revenueOfItems([
        { quantity: 2, unit_price: 100, status: 'served' },
        { quantity: 1, unit_price: 50, status: 'ordered' },
      ]),
    ).toBe(250)
  })

  it('excludes returned items', () => {
    expect(
      revenueOfItems([
        { quantity: 2, unit_price: 100, status: 'served' },
        { quantity: 1, unit_price: 50, status: 'returned' },
      ]),
    ).toBe(200)
  })
})

describe('aggregateRevenue', () => {
  const rows: RevenueRow[] = [
    // 6pm Manila Jun 4 (10:00 UTC) -> business day Jun 4
    { quantity: 2, unit_price: 100, status: 'served', created_at: '2026-06-04T10:00:00Z', tab_id: 't1', item_name: 'Beer', category_name: 'Drinks' },
    // 1am Manila Jun 5 (= Jun 4 17:00 UTC) -> still business day Jun 4
    { quantity: 1, unit_price: 200, status: 'ordered', created_at: '2026-06-04T17:00:00Z', tab_id: 't1', item_name: 'Whisky', category_name: 'Drinks' },
    // returned -> excluded everywhere
    { quantity: 1, unit_price: 999, status: 'returned', created_at: '2026-06-04T11:00:00Z', tab_id: 't2', item_name: 'Wine', category_name: 'Drinks' },
    // a second bill, Jun 4
    { quantity: 3, unit_price: 50, status: 'served', created_at: '2026-06-04T12:00:00Z', tab_id: 't2', item_name: 'Fries', category_name: 'Food' },
  ]

  const range = { timezone: tz, openTime: open, startDay: '2026-06-04', endDay: '2026-06-04' }

  it('buckets a past-midnight night into one business day', () => {
    const s = aggregateRevenue(rows, range)
    expect(s.total).toBe(550) // 200 beer + 200 whisky + 150 fries
    expect(s.perDay).toHaveLength(1)
    expect(s.perDay[0]).toMatchObject({ day: '2026-06-04', revenue: 550, billCount: 2 })
  })

  it('counts distinct tabs as bills and computes average bill', () => {
    const s = aggregateRevenue(rows, range)
    expect(s.billCount).toBe(2)
    expect(s.averageBill).toBe(275)
    expect(s.itemCount).toBe(6) // 2 + 1 + 3 (wine returned, excluded)
  })

  it('ranks top items and categories by revenue', () => {
    const s = aggregateRevenue(rows, range)
    expect(s.topItems[0].name).toBe('Beer')
    expect(s.topCategories[0]).toMatchObject({ name: 'Drinks', revenue: 400 })
    expect(s.topCategories[1]).toMatchObject({ name: 'Food', revenue: 150 })
  })

  it('excludes rows outside the business-day range', () => {
    const s = aggregateRevenue(rows, { ...range, startDay: '2026-06-05', endDay: '2026-06-05' })
    expect(s.total).toBe(0)
    expect(s.perDay).toHaveLength(0)
    expect(s.averageBill).toBe(0)
  })
})

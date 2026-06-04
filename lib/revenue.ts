import type { OrderItemStatus } from './database.types'
import { businessDay } from './business-day'

// A flattened order-item row used for revenue reporting. The page normalises
// the nested Supabase query result into this shape before aggregating.
export interface RevenueRow {
  quantity: number
  unit_price: number
  status: OrderItemStatus
  created_at: string
  tab_id: string | null
  item_name: string
  category_name: string
}

export interface RevenueRank {
  name: string
  quantity: number
  revenue: number
}

export interface RevenueSummary {
  total: number
  itemCount: number
  billCount: number
  averageBill: number
  perDay: Array<{ day: string; revenue: number; billCount: number }>
  topItems: RevenueRank[]
  topCategories: RevenueRank[]
}

// Canonical revenue rule: quantity * unit_price, excluding returned items.
// Mirrors the tab-detail total in app/(app)/tabs/[id]/page.tsx.
export function revenueOfItems(
  items: Array<{ quantity: number; unit_price: number; status: OrderItemStatus }>,
): number {
  return items.reduce(
    (sum, i) => (i.status === 'returned' ? sum : sum + i.quantity * i.unit_price),
    0,
  )
}

function rank(map: Map<string, RevenueRank>): RevenueRank[] {
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

// Bucket rows into business days within [startDay, endDay] and roll up totals.
// Returned items are excluded from every monetary figure and item count.
export function aggregateRevenue(
  rows: RevenueRow[],
  opts: { timezone: string; openTime: string; startDay: string; endDay: string },
): RevenueSummary {
  const { timezone, openTime, startDay, endDay } = opts

  const perDay = new Map<string, { revenue: number; tabs: Set<string> }>()
  const items = new Map<string, RevenueRank>()
  const categories = new Map<string, RevenueRank>()
  const bills = new Set<string>()

  let total = 0
  let itemCount = 0

  for (const row of rows) {
    if (row.status === 'returned') continue

    const day = businessDay(row.created_at, timezone, openTime)
    if (day < startDay || day > endDay) continue

    const value = row.quantity * row.unit_price
    total += value
    itemCount += row.quantity
    if (row.tab_id) bills.add(row.tab_id)

    const dayBucket = perDay.get(day) ?? { revenue: 0, tabs: new Set<string>() }
    dayBucket.revenue += value
    if (row.tab_id) dayBucket.tabs.add(row.tab_id)
    perDay.set(day, dayBucket)

    const item = items.get(row.item_name) ?? { name: row.item_name, quantity: 0, revenue: 0 }
    item.quantity += row.quantity
    item.revenue += value
    items.set(row.item_name, item)

    const cat = categories.get(row.category_name) ?? { name: row.category_name, quantity: 0, revenue: 0 }
    cat.quantity += row.quantity
    cat.revenue += value
    categories.set(row.category_name, cat)
  }

  return {
    total,
    itemCount,
    billCount: bills.size,
    averageBill: bills.size ? total / bills.size : 0,
    perDay: [...perDay.entries()]
      .map(([day, b]) => ({ day, revenue: b.revenue, billCount: b.tabs.size }))
      .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0)),
    topItems: rank(items),
    topCategories: rank(categories),
  }
}

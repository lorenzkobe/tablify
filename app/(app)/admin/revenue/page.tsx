import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { RevenueManager } from '@/components/revenue/revenue-manager'
import { RevenueDataSkeleton } from '@/components/revenue/revenue-skeleton'
import { getOrganisation, DEFAULT_ORG } from '@/lib/organisation'
import { businessDayNow, rangeToUtcBounds } from '@/lib/business-day'
import { aggregateRevenue, type RevenueRow } from '@/lib/revenue'
import { formatCurrency } from '@/lib/format'
import { RevenueTrendChart } from '@/components/revenue/revenue-trend-chart'
import { PeakHoursChart } from '@/components/revenue/peak-hours-chart'
import { ItemDemandChart } from '@/components/revenue/item-demand-chart'
import { CategoryShareChart } from '@/components/revenue/category-share-chart'
import { ItemStatsTable } from '@/components/revenue/item-stats-table'
import { Scroll, Receipt, TrendingUp, Package, Layers, CalendarDays } from 'lucide-react'
import type { OrderItemStatus, Organisation } from '@/lib/database.types'

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

interface RevenueQueryRow {
  quantity: number
  unit_price: number
  status: OrderItemStatus
  created_at: string
  menu_items: { name: string; menu_categories: { name: string } | null } | null
  orders: { tab_id: string } | null
}

function formatDay(dayKey: string): string {
  return new Date(`${dayKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const org = (await getOrganisation()) ?? DEFAULT_ORG
  const today = businessDayNow(org.timezone, org.open_time)

  const sp = await searchParams
  const startDay = sp.from && DAY_RE.test(sp.from) ? sp.from : today
  const endDay = sp.to && DAY_RE.test(sp.to) && sp.to >= startDay ? sp.to : startDay

  const rangeLabel =
    startDay === endDay ? formatDay(startDay) : `${formatDay(startDay)} – ${formatDay(endDay)}`

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Revenue" description={rangeLabel} />

      <RevenueManager today={today} from={startDay} to={endDay}>
        {/* Keyed on the range so the skeleton re-shows on every range change */}
        <Suspense key={`${startDay}:${endDay}`} fallback={<RevenueDataSkeleton />}>
          <RevenueData org={org} startDay={startDay} endDay={endDay} />
        </Suspense>
      </RevenueManager>
    </div>
  )
}

async function RevenueData({
  org,
  startDay,
  endDay,
}: {
  org: Pick<Organisation, 'timezone' | 'open_time' | 'currency'>
  startDay: string
  endDay: string
}) {
  const supabase = await createClient()
  const { startUtc, endUtc } = rangeToUtcBounds(startDay, endDay)

  const { data } = await supabase
    .from('order_items')
    .select(`
      quantity, unit_price, status, created_at,
      menu_items ( name, menu_categories ( name ) ),
      orders!inner ( tab_id )
    `)
    .gte('created_at', startUtc)
    .lte('created_at', endUtc)

  const rows: RevenueRow[] = ((data ?? []) as unknown as RevenueQueryRow[]).map((r) => ({
    quantity: r.quantity,
    unit_price: r.unit_price,
    status: r.status,
    created_at: r.created_at,
    tab_id: r.orders?.tab_id ?? null,
    item_name: r.menu_items?.name ?? 'Unknown item',
    category_name: r.menu_items?.menu_categories?.name ?? 'Uncategorised',
  }))

  const summary = aggregateRevenue(rows, {
    timezone: org.timezone,
    openTime: org.open_time,
    startDay,
    endDay,
  })

  const currency = org.currency

  const stats = [
    { label: 'Revenue', value: formatCurrency(summary.total, currency), icon: TrendingUp, accent: 'bg-primary/10 text-primary' },
    { label: 'Bills', value: String(summary.billCount), icon: Receipt, accent: 'bg-muted text-muted-foreground' },
    { label: 'Avg Bill', value: formatCurrency(summary.averageBill, currency), icon: Scroll, accent: 'bg-muted text-muted-foreground' },
    { label: 'Items Sold', value: String(summary.itemCount), icon: Package, accent: 'bg-muted text-muted-foreground' },
    { label: 'Avg Items/Bill', value: summary.itemsPerBill.toFixed(1), icon: Layers, accent: 'bg-muted text-muted-foreground' },
    { label: 'Busiest Day', value: summary.busiestDay ? formatDay(summary.busiestDay.day) : '—', icon: CalendarDays, accent: 'bg-muted text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="surface-raised rounded-xl border border-border bg-card p-4">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${s.accent}`}>
              <s.icon size={15} />
            </span>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {summary.total === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No sales in this range</p>
          <p className="text-xs text-muted-foreground mt-1">Pick another day or range above.</p>
        </div>
      ) : (
        <>
          {/* Revenue over time */}
          {summary.perDay.length > 0 && (
            <RevenueTrendChart data={summary.perDay} currency={currency} />
          )}

          {/* Peak hours */}
          {summary.perHour.length > 0 && (
            <PeakHoursChart data={summary.perHour} currency={currency} />
          )}

          {/* Demand + category share */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ItemDemandChart items={summary.topItems} />
            <CategoryShareChart data={summary.topCategories} currency={currency} />
          </div>

          {/* Detailed item stats + top categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ItemStatsTable items={summary.topItems} total={summary.total} currency={currency} />
            <RankList title="Top categories" rows={summary.topCategories.slice(0, 8)} currency={currency} />
          </div>
        </>
      )}
    </div>
  )
}

function RankList({
  title,
  rows,
  currency,
}: {
  title: string
  rows: Array<{ name: string; quantity: number; revenue: number }>
  currency: string
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-card">
            <span className="min-w-0 flex-1 truncate text-sm">
              {r.name}
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">×{r.quantity}</span>
            </span>
            <span className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(r.revenue, currency)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { RevenueManager } from '@/components/revenue/revenue-manager'
import { getOrganisation, DEFAULT_ORG } from '@/lib/organisation'
import { businessDayNow, rangeToUtcBounds } from '@/lib/business-day'
import { aggregateRevenue, type RevenueRow } from '@/lib/revenue'
import { formatCurrency } from '@/lib/format'
import { Scroll, Receipt, TrendingUp, Package } from 'lucide-react'
import type { OrderItemStatus } from '@/lib/database.types'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const org = (await getOrganisation()) ?? DEFAULT_ORG
  const today = businessDayNow(org.timezone, org.open_time)

  const sp = await searchParams
  const startDay = sp.from && DAY_RE.test(sp.from) ? sp.from : today
  const endDay = sp.to && DAY_RE.test(sp.to) && sp.to >= startDay ? sp.to : startDay

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
  const maxDay = Math.max(1, ...summary.perDay.map((d) => d.revenue))

  const rangeLabel =
    startDay === endDay ? formatDay(startDay) : `${formatDay(startDay)} – ${formatDay(endDay)}`

  const stats = [
    { label: 'Revenue', value: formatCurrency(summary.total, currency), icon: TrendingUp, accent: 'bg-primary/10 text-primary' },
    { label: 'Bills', value: String(summary.billCount), icon: Receipt, accent: 'bg-muted text-muted-foreground' },
    { label: 'Avg Bill', value: formatCurrency(summary.averageBill, currency), icon: Scroll, accent: 'bg-muted text-muted-foreground' },
    { label: 'Items Sold', value: String(summary.itemCount), icon: Package, accent: 'bg-muted text-muted-foreground' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Revenue" description={rangeLabel} />

      <RevenueManager today={today} from={startDay} to={endDay} />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          {/* Per business day */}
          {summary.perDay.length > 1 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                By business day
              </h2>
              <div className="space-y-2">
                {summary.perDay.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{formatDay(d.day)}</span>
                    <div className="flex-1 h-7 rounded-md bg-primary/10 overflow-hidden">
                      <div
                        className="h-full rounded-md bg-primary/60"
                        style={{ width: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums">
                      {formatCurrency(d.revenue, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top items + categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <RankList title="Top items" rows={summary.topItems.slice(0, 8)} currency={currency} />
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

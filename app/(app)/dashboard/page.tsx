import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge, ORDER_STATUS_TONE } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Table2, Scroll, ClipboardList, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/format'
import type { OrderStatus } from '@/lib/database.types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [tablesRes, tabsRes, ordersRes, recentRes] = await Promise.all([
    supabase.from('venue_tables').select('status'),
    supabase.from('tabs').select('status').eq('status', 'open'),
    supabase.from('orders').select('status').in('status', ['pending', 'in_progress', 'ready']),
    supabase
      .from('orders')
      .select('id, status, created_at, venue_tables(label), tabs(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const occupiedTables = tablesRes.data?.filter((t) => t.status === 'occupied').length ?? 0
  const totalTables = tablesRes.data?.length ?? 0
  const openTabs = tabsRes.data?.length ?? 0
  const activeOrders = ordersRes.data?.length ?? 0
  const recentOrders = recentRes.data ?? []

  const occupancyPct = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-10">
      <PageHeader
        title="Dashboard"
        description="Live overview of your venue"
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-primary text-primary" />
            Realtime
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {/* Tables */}
        <Link href="/tables" className="group block h-full">
          <div className="surface-raised h-full rounded-xl border border-border bg-card p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
                <Table2 size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {occupiedTables}
              <span className="text-xl font-normal text-muted-foreground ml-1">/ {totalTables}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Tables Occupied</p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{occupancyPct}% occupancy</p>
          </div>
        </Link>

        {/* Open Tabs */}
        <Link href="/tabs" className="group block h-full">
          <div className="surface-raised h-full rounded-xl border border-border bg-card p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
                <Scroll size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{openTabs}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Open Tabs</p>
            <div className="h-1.5 rounded-full bg-transparent" />
            <p className="text-[10px] text-transparent mt-1">–</p>
          </div>
        </Link>

        {/* Active Orders */}
        <Link href="/orders" className="group block h-full">
          <div className="surface-raised h-full rounded-xl border border-border bg-card p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
                <ClipboardList size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{activeOrders}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Active Orders</p>
            <div className="h-1.5 rounded-full bg-transparent" />
            <p className="text-[10px] text-transparent mt-1">–</p>
          </div>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Orders
          </h2>
          <Link
            href="/orders"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {recentOrders.map((order) => {
              const location =
                (order.venue_tables as { label: string } | null)?.label ??
                (order.tabs as { name: string } | null)?.name ??
                'Unknown'
              const accentColor = ORDER_STATUS_TONE[order.status as OrderStatus].dot
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
                >
                  {/* Status accent strip */}
                  <span className={`w-0.5 self-stretch rounded-full shrink-0 ${accentColor}`} />

                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{location}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                        <Clock size={11} />
                        {formatDistanceToNow(order.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

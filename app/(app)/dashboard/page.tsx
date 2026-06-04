import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge } from '@/components/shared/status-badge'
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Live overview of your venue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {/* Tables — sky accent */}
        <Link href="/tables" className="group block h-full">
          <div className="h-full rounded-xl border border-border bg-card p-5 hover:border-sky-400/40 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Table2 size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-bold tracking-tight tabular-nums">
              {occupiedTables}
              <span className="text-xl font-normal text-muted-foreground ml-1">/ {totalTables}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Tables Occupied</p>
            {/* Occupancy bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{occupancyPct}% occupancy</p>
          </div>
        </Link>

        {/* Open Tabs — amber accent */}
        <Link href="/tabs" className="group block h-full">
          <div className="h-full rounded-xl border border-border bg-card p-5 hover:border-amber-400/40 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Scroll size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-bold tracking-tight tabular-nums">{openTabs}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Open Tabs</p>
            <div className="h-1.5 rounded-full bg-transparent" />
            <p className="text-[10px] text-transparent mt-1">–</p>
          </div>
        </Link>

        {/* Active Orders — emerald accent */}
        <Link href="/orders" className="group block h-full">
          <div className="h-full rounded-xl border border-border bg-card p-5 hover:border-emerald-400/40 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ClipboardList size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-bold tracking-tight tabular-nums">{activeOrders}</p>
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
              const accentColor = statusAccent(order.status as OrderStatus)
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

function statusAccent(status: OrderStatus): string {
  switch (status) {
    case 'pending':     return 'bg-amber-400'
    case 'in_progress': return 'bg-orange-400'
    case 'ready':       return 'bg-emerald-400'
    case 'served':      return 'bg-slate-300'
    case 'paid':        return 'bg-sky-400'
    case 'cancelled':   return 'bg-red-400'
    default:            return 'bg-border'
  }
}

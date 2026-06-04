import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow, formatCurrency } from '@/lib/format'
import Link from 'next/link'
import type { OrderStatus } from '@/lib/database.types'

const STATUS_FILTERS: {
  label: string
  value: OrderStatus | 'all'
  dot?: string
}[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending', dot: 'bg-amber-500' },
  { label: 'In Progress', value: 'in_progress', dot: 'bg-orange-500' },
  { label: 'Ready', value: 'ready', dot: 'bg-green-500' },
  { label: 'Served', value: 'served', dot: 'bg-slate-400' },
  { label: 'Paid', value: 'paid', dot: 'bg-sky-500' },
  { label: 'Cancelled', value: 'cancelled', dot: 'bg-red-500' },
]

const STATUS_BORDER: Record<OrderStatus, string> = {
  pending:     'border-amber-400',
  in_progress: 'border-orange-400',
  ready:       'border-green-400',
  served:      'border-slate-300 dark:border-slate-600',
  paid:        'border-sky-400',
  cancelled:   'border-red-400',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  ready:       'Ready',
  served:      'Served',
  paid:        'Paid',
  cancelled:   'Cancelled',
}

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending:     'text-amber-600 dark:text-amber-400',
  in_progress: 'text-orange-600 dark:text-orange-400',
  ready:       'text-green-600 dark:text-green-400',
  served:      'text-slate-500 dark:text-slate-400',
  paid:        'text-sky-600 dark:text-sky-400',
  cancelled:   'text-red-600 dark:text-red-400',
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`
      id, status, created_at,
      venue_tables(label),
      tabs(name),
      profiles(full_name),
      order_items(quantity, unit_price)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusParam && statusParam !== 'all') {
    query = query.eq('status', statusParam as OrderStatus)
  }

  const { data: orders } = await query
  const activeFilter = (statusParam && statusParam !== 'all') ? statusParam as OrderStatus : null

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        {orders && orders.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {orders.length}{orders.length === 100 ? '+' : ''} result{orders.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(({ label, value, dot }) => {
          const isActive = value === 'all' ? !statusParam || statusParam === 'all' : statusParam === value
          return (
            <Link
              key={value}
              href={value === 'all' ? '/orders' : `/orders?status=${value}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
                isActive
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />}
              {label}
            </Link>
          )
        })}
      </div>

      {!orders?.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {activeFilter ? `No ${STATUS_LABEL[activeFilter].toLowerCase()} orders.` : 'No orders yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {orders.map((order) => {
            const location =
              (order.venue_tables as { label: string } | null)?.label ??
              (order.tabs as { name: string } | null)?.name ??
              'Unknown'
            const isTab = !!(order.tabs as { name: string } | null)?.name
            const total = (order.order_items as Array<{ quantity: number; unit_price: number }> | null)
              ?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) ?? 0
            const itemCount = (order.order_items as Array<unknown> | null)?.length ?? 0
            const server = (order.profiles as { full_name: string } | null)?.full_name

            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className={`flex items-center gap-4 rounded-lg border-l-[3px] bg-card px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${STATUS_BORDER[order.status]}`}>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{location}</span>
                      {isTab && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                          TAB
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      {server && (
                        <>
                          <span>·</span>
                          <span className="truncate">{server}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(total)}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(order.created_at)}</p>
                    </div>
                    <span className={`text-xs font-medium w-[76px] text-right ${STATUS_TEXT[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

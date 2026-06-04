import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ItemStatusBadge, ORDER_STATUS_TONE } from '@/components/shared/status-badge'
import { formatCurrency, formatTime } from '@/lib/format'
import { UpdateOrderStatusButton } from '@/components/orders/update-order-status-button'
import { UpdateItemStatusButton } from '@/components/orders/update-item-status-button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { OrderStatus } from '@/lib/database.types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  ready:       'Ready',
  served:      'Served',
  paid:        'Paid',
  cancelled:   'Cancelled',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(full_name),
      venue_tables(id, label),
      tabs(id, name),
      order_items(*, menu_items(name))
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const tableData = order.venue_tables as { id: string; label: string } | null
  const tabData = order.tabs as { id: string; name: string } | null
  const location = tableData?.label ?? tabData?.name ?? 'Unknown'
  const backHref = tableData ? `/tables/${tableData.id}` : tabData ? `/tabs/${tabData.id}` : '/orders'
  const backLabel = tableData ? `Table ${tableData.label}` : tabData ? tabData.name : 'Orders'

  const total = (order.order_items as Array<{ quantity: number; unit_price: number }> | null)
    ?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{location}</h1>
            {tabData && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">
                TAB
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTime(order.created_at)} · by {(order.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${ORDER_STATUS_TONE[order.status].badge}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {order.notes && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">{order.notes}</p>
      )}

      <div className="rounded-xl border divide-y divide-border overflow-hidden">
        {(order.order_items as Array<{
          id: string
          quantity: number
          unit_price: number
          status: string
          notes: string | null
          menu_items: { name: string } | null
        }> | null)?.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-4 py-3">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {item.quantity}× {item.menu_items?.name}
                </span>
                <ItemStatusBadge status={item.status as Parameters<typeof ItemStatusBadge>[0]['status']} />
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground">{item.notes}</p>
              )}
              <UpdateItemStatusButton
                itemId={item.id}
                currentStatus={item.status as Parameters<typeof ItemStatusBadge>[0]['status']}
              />
            </div>
            <span className="text-sm text-muted-foreground shrink-0 mt-0.5 tabular-nums">
              {formatCurrency(item.quantity * item.unit_price)}
            </span>
          </div>
        ))}

        <div className="flex justify-between px-4 py-3 font-semibold bg-muted/30">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>

      <UpdateOrderStatusButton orderId={order.id} currentStatus={order.status} />

      <p className="text-[10px] text-muted-foreground font-mono">
        Order {order.id} · <Link href="/orders" className="hover:underline">{backLabel !== 'Orders' ? 'Back to orders' : 'All orders'}</Link>
      </p>
    </div>
  )
}

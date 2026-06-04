import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge, ItemStatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatTime } from '@/lib/format'
import { NewOrderButton } from '@/components/orders/new-order-button'
import { UpdateOrderStatusButton } from '@/components/orders/update-order-status-button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CloseTabButton } from '@/components/tabs/close-tab-button'

export default async function TabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tab } = await supabase
    .from('tabs')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .single()

  if (!tab) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(full_name),
      order_items(*, menu_items(name, price))
    `)
    .eq('tab_id', id)
    .order('created_at', { ascending: false })

  const activeOrders = orders?.filter((o) => o.status !== 'paid' && o.status !== 'cancelled') ?? []

  const grandTotal = orders?.reduce((sum, order) => {
    if (order.status === 'cancelled') return sum
    return (
      sum +
      (order.order_items?.reduce(
        (s: number, item: { quantity: number; unit_price: number }) =>
          s + item.quantity * item.unit_price,
        0
      ) ?? 0)
    )
  }, 0) ?? 0

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/tabs" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{tab.name}</h1>
          <p className="text-sm text-muted-foreground">
            Opened by {(tab.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'}
          </p>
        </div>
        {tab.status === 'open' && (
          <div className="flex flex-col items-end gap-1">
            {grandTotal > 0 && (
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(grandTotal)}</p>
            )}
            <CloseTabButton tabId={tab.id} tabName={tab.name} total={grandTotal} />
          </div>
        )}
      </div>

      {tab.status === 'open' && (
        <NewOrderButton tabId={tab.id} tableName={tab.name} />
      )}

      {activeOrders.map((order) => {
        const total = order.order_items?.reduce(
          (s: number, item: { quantity: number; unit_price: number }) =>
            s + item.quantity * item.unit_price,
          0
        ) ?? 0

        return (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTime(order.created_at)} · by{' '}
                {(order.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.order_items?.map((item: {
                id: string
                quantity: number
                unit_price: number
                status: string
                notes: string | null
                menu_items: { name: string } | null
              }) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {item.quantity}× {item.menu_items?.name}
                      </span>
                      <ItemStatusBadge status={item.status as Parameters<typeof ItemStatusBadge>[0]['status']} />
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </span>
                </div>
              ))}

              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <UpdateOrderStatusButton orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
        )
      })}

      {orders && orders.length > 0 && (
        <div className="border-t pt-4 flex justify-between text-lg font-semibold">
          <span>Tab Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      )}

      {!activeOrders.length && tab.status === 'open' && (
        <p className="text-muted-foreground text-sm">No active orders. Start one above.</p>
      )}
    </div>
  )
}

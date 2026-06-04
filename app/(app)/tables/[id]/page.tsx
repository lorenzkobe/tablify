import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge, ItemStatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatTime } from '@/lib/format'
import { NewOrderButton } from '@/components/orders/new-order-button'
import { UpdateOrderStatusButton } from '@/components/orders/update-order-status-button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: table } = await supabase
    .from('venue_tables')
    .select('*')
    .eq('id', id)
    .single()

  if (!table) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(full_name),
      order_items(*, menu_items(name, price))
    `)
    .eq('table_id', id)
    .not('status', 'in', '("paid","cancelled")')
    .order('created_at', { ascending: false })

  const activeOrder = orders?.[0] ?? null

  const total = activeOrder?.order_items?.reduce(
    (sum: number, item: { quantity: number; unit_price: number }) =>
      sum + item.quantity * item.unit_price,
    0
  ) ?? 0

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/tables" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{table.label}</h1>
          <p className="text-sm text-muted-foreground">Capacity: {table.capacity}</p>
        </div>
      </div>

      {!activeOrder ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">No active order for this table.</p>
          <NewOrderButton tableId={table.id} tableName={table.label} />
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Order #{activeOrder.id.slice(0, 8)}
                </CardTitle>
                <OrderStatusBadge status={activeOrder.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTime(activeOrder.created_at)} · by{' '}
                {(activeOrder.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'}
              </p>
              {activeOrder.notes && (
                <p className="text-sm italic text-muted-foreground">{activeOrder.notes}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {activeOrder.order_items?.map((item: {
                id: string
                quantity: number
                unit_price: number
                status: string
                notes: string | null
                menu_items: { name: string } | null
              }) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
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
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div className="flex gap-2 pt-2 flex-wrap">
                <UpdateOrderStatusButton orderId={activeOrder.id} currentStatus={activeOrder.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

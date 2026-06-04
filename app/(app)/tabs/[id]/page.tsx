import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ItemStatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatTime } from '@/lib/format'
import { NewOrderButton } from '@/components/orders/new-order-button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CloseTabButton } from '@/components/tabs/close-tab-button'
import { OrderLogMenu, type OrderLogEntry } from '@/components/tabs/order-log-sheet'
import type { OrderItemStatus } from '@/lib/database.types'

const EVENT_VERB: Record<OrderItemStatus, string> = {
  ordered:     'Re-queued',
  in_progress: 'Started',
  ready:       'Ready',
  served:      'Served',
  returned:    'Returned',
}

interface TabOrderItem {
  id: string
  quantity: number
  unit_price: number
  status: OrderItemStatus
  notes: string | null
  menu_items: { name: string } | null
}

interface StatusEventRow {
  order_item_id: string
  to_status: OrderItemStatus
  created_at: string
  profiles: { full_name: string } | null
}

function itemTotal(items: TabOrderItem[]): number {
  return items.reduce(
    (s, item) => (item.status === 'returned' ? s : s + item.quantity * item.unit_price),
    0
  )
}

export default async function TabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const isAdmin = me?.role === 'admin'

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
      order_items(*, menu_items(name))
    `)
    .eq('tab_id', id)
    .order('created_at', { ascending: false })

  const rounds = orders ?? []

  // Per-item status history (audit trail).
  const itemIds = rounds.flatMap((o) => (o.order_items as TabOrderItem[] | null)?.map((i) => i.id) ?? [])
  const eventsByItem: Record<string, StatusEventRow[]> = {}
  if (itemIds.length > 0) {
    const { data: events } = await supabase
      .from('status_events')
      .select('order_item_id, to_status, created_at, profiles(full_name)')
      .in('order_item_id', itemIds)
      .order('created_at', { ascending: true })
    for (const ev of (events ?? []) as StatusEventRow[]) {
      ;(eventsByItem[ev.order_item_id] ??= []).push(ev)
    }
  }

  const grandTotal = rounds.reduce(
    (sum, order) => sum + itemTotal((order.order_items as TabOrderItem[] | null) ?? []),
    0
  )

  // Flat, time-sorted timeline for the Order Log. Each item gets a synthetic
  // "Placed" origin (no status_event exists for creation), then its transitions.
  // The round short-id tags entries so identical items from different rounds stay
  // distinguishable.
  const logEntries: OrderLogEntry[] = []
  for (const order of rounds) {
    const roundShort = order.id.slice(0, 8)
    const placedBy = (order.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'
    const items = (order.order_items as TabOrderItem[] | null) ?? []
    for (const item of items) {
      const itemName = item.menu_items?.name ?? 'Item'
      logEntries.push({
        id: `placed-${item.id}`,
        at: order.created_at,
        itemName,
        quantity: item.quantity,
        roundShort,
        toStatus: 'ordered',
        isOrigin: true,
        actor: placedBy,
      })
      ;(eventsByItem[item.id] ?? []).forEach((ev, idx) => {
        logEntries.push({
          id: `${item.id}-${idx}`,
          at: ev.created_at,
          itemName,
          quantity: item.quantity,
          roundShort,
          toStatus: ev.to_status,
          isOrigin: false,
          actor: ev.profiles?.full_name ?? 'Unknown',
        })
      })
    }
  }
  logEntries.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/tabs"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          aria-label="Back to tabs"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{tab.name}</h1>
          <p className="text-sm text-muted-foreground">
            Opened by {(tab.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'}
          </p>
        </div>
        <OrderLogMenu tabName={tab.name} entries={logEntries} />
      </div>

      {tab.status === 'open' && <NewOrderButton tabId={tab.id} tabName={tab.name} />}

      {rounds.map((order) => {
        const items = (order.order_items as TabOrderItem[] | null) ?? []
        const total = itemTotal(items)

        return (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Round #{order.id.slice(0, 8)}</CardTitle>
                <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTime(order.created_at)} · by{' '}
                {(order.profiles as { full_name: string } | null)?.full_name ?? 'Unknown'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => {
                const history = eventsByItem[item.id] ?? []
                return (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {item.quantity}× {item.menu_items?.name}
                        </span>
                        <ItemStatusBadge status={item.status} />
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                      )}
                      {history.length > 0 && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1 leading-snug">
                          {history
                            .map(
                              (ev) =>
                                `${EVENT_VERB[ev.to_status]} by ${ev.profiles?.full_name ?? 'Unknown'} ${formatTime(ev.created_at)}`
                            )
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {!rounds.length && tab.status === 'open' && (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No orders yet</p>
          <p className="text-xs text-muted-foreground mt-1">Use the button above to add the first round.</p>
        </div>
      )}

      {(rounds.length > 0 || tab.status === 'open') && (
        <div className="border-t border-border pt-4 space-y-3">
          {rounds.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold tracking-tight">Tab Total</span>
              <span className="text-lg font-bold tabular-nums tracking-tight">{formatCurrency(grandTotal)}</span>
            </div>
          )}
          {tab.status === 'open' && (
            <div className="flex justify-end">
              {isAdmin ? (
                <CloseTabButton tabId={tab.id} tabName={tab.name} total={grandTotal} />
              ) : (
                <span className="text-xs text-muted-foreground">Admin closes the bill</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

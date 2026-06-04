'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateItemStatus } from '@/app/actions/orders'
import {
  NEXT_ITEM_STATUS,
  PREV_ITEM_STATUS,
  ITEM_ACTION_LABEL,
  QUEUE_STATUSES,
} from '@/lib/order-status'
import { formatTime } from '@/lib/format'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import {
  ChefHat, Clock, CheckCheck, Flame, AlertTriangle, Undo2,
} from 'lucide-react'
import type { OrderItemStatus } from '@/lib/database.types'

interface QueueItem {
  id: string
  order_id: string
  quantity: number
  status: OrderItemStatus
  notes: string | null
  created_at: string
  menu_items: { name: string } | null
  orders: {
    id: string
    notes: string | null
    created_at: string
    tabs: { name: string } | null
  } | null
}

const QUEUE_SELECT =
  '*, menu_items(name), orders(id, notes, created_at, tabs(name))'

function getAgeMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

function TicketAgeIndicator({ createdAt }: { createdAt: string }) {
  const [mins, setMins] = useState(() => getAgeMinutes(createdAt))

  useEffect(() => {
    const interval = setInterval(() => setMins(getAgeMinutes(createdAt)), 30000)
    return () => clearInterval(interval)
  }, [createdAt])

  const urgent = mins >= 15
  const warning = mins >= 8

  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${
        urgent ? 'text-destructive' : warning ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      {urgent ? <AlertTriangle size={11} /> : <Clock size={11} />}
      {mins}m
    </span>
  )
}

type PendingChange = {
  item: QueueItem
  toStatus: OrderItemStatus
  title: string
  confirmLabel: string
  kind: 'advance' | 'revert'
}

function TicketCard({
  orderId,
  groupItems,
  onRequest,
}: {
  orderId: string
  groupItems: QueueItem[]
  onRequest: (change: PendingChange) => void
}) {
  const order = groupItems[0]?.orders
  const location = order?.tabs?.name ?? 'Unknown'
  const hasInProgress = groupItems.some((i) => i.status === 'in_progress')
  const allOrdered = groupItems.every((i) => i.status === 'ordered')
  const allReady = groupItems.every((i) => i.status === 'ready')
  const totalItems = groupItems.reduce((sum, i) => sum + i.quantity, 0)

  const [ageMinutes, setAgeMinutes] = useState(() =>
    getAgeMinutes(order?.created_at ?? new Date().toISOString())
  )
  useEffect(() => {
    const interval = setInterval(
      () => setAgeMinutes(getAgeMinutes(order?.created_at ?? new Date().toISOString())),
      30000
    )
    return () => clearInterval(interval)
  }, [order?.created_at])

  const isUrgent = ageMinutes >= 15

  const cardBorder = isUrgent
    ? 'border-destructive/70'
    : hasInProgress
    ? 'border-primary/50'
    : 'border-border'

  const headerBg = isUrgent
    ? 'bg-destructive/10'
    : hasInProgress
    ? 'bg-primary/10'
    : 'bg-muted/40'

  const accentStripe = isUrgent
    ? 'bg-destructive'
    : hasInProgress
    ? 'bg-primary'
    : allReady
    ? 'bg-foreground/40'
    : 'bg-muted-foreground/40'

  return (
    <div className={`surface-raised relative flex flex-col rounded-xl border-2 ${cardBorder} bg-card overflow-hidden`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${accentStripe}`} />
      {isUrgent && <div className="absolute top-0 inset-x-0 h-px bg-destructive/60" />}

      <div className={`${headerBg} pl-5 pr-4 py-3 flex items-start justify-between gap-3`}>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold tracking-tight leading-none truncate">{location}</p>
          <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
            Placed {formatTime(order?.created_at ?? '')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
          {order?.created_at && <TicketAgeIndicator createdAt={order.created_at} />}
          <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground leading-none">
            #{orderId.slice(0, 6).toUpperCase()}
          </span>
        </div>
      </div>

      {order?.notes && (
        <div className="pl-5 pr-4 py-2.5 border-b border-border bg-muted/40 flex items-start gap-2">
          <Flame size={13} className="text-muted-foreground mt-px shrink-0" />
          <p className="text-xs font-semibold text-foreground leading-snug">{order.notes}</p>
        </div>
      )}

      <div className="flex-1 divide-y divide-border/50">
        {groupItems.map((item) => {
          const nextStatus = NEXT_ITEM_STATUS[item.status]
          const prevStatus = PREV_ITEM_STATUS[item.status]
          const isInProgress = item.status === 'in_progress'
          const isReady = item.status === 'ready'

          return (
            <div key={item.id} className="pl-5 pr-4 pt-3 pb-3 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold tabular-nums leading-none ${
                        isReady
                          ? 'bg-foreground/10 text-foreground'
                          : isInProgress
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.quantity}
                    </span>
                    <p className="font-semibold text-base leading-tight truncate text-foreground">
                      {item.menu_items?.name}
                    </p>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1 pl-8 leading-snug">{item.notes}</p>
                  )}
                </div>
                {isInProgress && <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-primary animate-pulse" />}
                {isReady && <CheckCheck size={16} className="shrink-0 mt-0.5 text-foreground" />}
              </div>

              <div className="flex items-center gap-2">
                {nextStatus && (
                  <button
                    onClick={() =>
                      onRequest({
                        item,
                        toStatus: nextStatus,
                        title: `${ITEM_ACTION_LABEL[item.status]} — ${item.quantity}× ${item.menu_items?.name ?? 'item'}?`,
                        confirmLabel: ITEM_ACTION_LABEL[item.status] ?? 'Confirm',
                        kind: 'advance',
                      })
                    }
                    className={`flex-1 rounded-lg py-3 text-sm font-bold tracking-wide transition-all duration-150 min-h-[48px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.98] ${
                      isReady
                        ? 'bg-foreground hover:bg-foreground/90 text-background'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    {isInProgress ? <CheckCheck size={16} strokeWidth={2.5} /> : isReady ? null : <Flame size={15} strokeWidth={2.5} />}
                    <span>{ITEM_ACTION_LABEL[item.status]}</span>
                  </button>
                )}
                {prevStatus && (
                  <button
                    onClick={() =>
                      onRequest({
                        item,
                        toStatus: prevStatus,
                        title: `Revert — ${item.quantity}× ${item.menu_items?.name ?? 'item'}?`,
                        confirmLabel: 'Revert',
                        kind: 'revert',
                      })
                    }
                    aria-label="Revert status"
                    className="shrink-0 rounded-lg min-h-[48px] min-w-[48px] px-3 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Undo2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pl-5 pr-4 py-2.5 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold leading-none ${
            isUrgent
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : allReady
              ? 'border-foreground/20 bg-foreground/5 text-foreground'
              : allOrdered
              ? 'border-border bg-muted text-muted-foreground'
              : 'border-primary/20 bg-primary/10 text-primary'
          }`}
        >
          {isUrgent && <AlertTriangle size={10} />}
          {isUrgent ? 'Overdue' : allReady ? 'Ready' : allOrdered ? 'Queued' : 'In Progress'}
        </span>
      </div>
    </div>
  )
}

export function QueueDisplay({ initialItems }: { initialItems: QueueItem[] }) {
  const [items, setItems] = useState<QueueItem[]>(initialItems)
  const [pending, setPending] = useState<PendingChange | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, async () => {
        const { data } = await supabase
          .from('order_items')
          .select(QUEUE_SELECT)
          .in('status', QUEUE_STATUSES)
          .order('created_at', { ascending: true })
        if (data) setItems(data as unknown as QueueItem[])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const orderGroups = items.reduce<Record<string, QueueItem[]>>((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {})

  async function handleConfirm() {
    if (!pending) return
    const { item, toStatus } = pending
    const result = await updateItemStatus(item.id, toStatus)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    // Optimistic: update locally, dropping anything that left the queue.
    setItems((prev) =>
      prev
        .map((i) => (i.id === item.id ? { ...i, status: toStatus } : i))
        .filter((i) => QUEUE_STATUSES.includes(i.status))
    )
  }

  if (Object.keys(orderGroups).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <ChefHat size={28} className="text-muted-foreground/40" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <CheckCheck size={11} className="text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold text-foreground text-base">All clear</p>
          <p className="text-sm text-muted-foreground max-w-[22rem] leading-snug">
            Nothing in the queue. New items appear here in real-time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(orderGroups).map(([orderId, groupItems]) => (
          <TicketCard key={orderId} orderId={orderId} groupItems={groupItems} onRequest={setPending} />
        ))}
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => { if (!open) setPending(null) }}
        title={pending?.title ?? ''}
        confirmLabel={pending?.confirmLabel ?? 'Confirm'}
        loadingLabel="Updating…"
        cancelLabel="Cancel"
        tone="warning"
        icon={pending?.kind === 'revert' ? <Undo2 size={18} /> : <CheckCheck size={18} />}
        onConfirm={handleConfirm}
      />
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateItemsStatus } from '@/app/actions/orders'
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
  ChefHat, Clock, CheckCheck, Flame, AlertTriangle, Undo2, User,
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
    tabs: { id: string; name: string } | null
    taker: { full_name: string } | null
  } | null
}

const QUEUE_SELECT =
  '*, menu_items(name), orders(id, notes, created_at, tabs(id, name), taker:profiles!orders_taken_by_fkey(full_name))'

// Bulk buttons render in flow order; the "serve" action gets primary emphasis.
const BULK_STATUS_ORDER: OrderItemStatus[] = ['ready', 'in_progress', 'ordered']

function getAgeMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

function useAgeMinutes(createdAt: string): number {
  const [mins, setMins] = useState(() => getAgeMinutes(createdAt))
  useEffect(() => {
    const interval = setInterval(() => setMins(getAgeMinutes(createdAt)), 30000)
    return () => clearInterval(interval)
  }, [createdAt])
  return mins
}

function TicketAgeIndicator({ createdAt }: { createdAt: string }) {
  const mins = useAgeMinutes(createdAt)
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

function StatusPill({ items, isUrgent }: { items: QueueItem[]; isUrgent: boolean }) {
  const allReady = items.every((i) => i.status === 'ready')
  const allOrdered = items.every((i) => i.status === 'ordered')
  return (
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
  )
}

// Who took this round. Some tabs are only understood by the crew member who
// took them, so this lets another crew know who to ask for clarification.
function TakerLabel({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground min-w-0">
      <User size={11} className="shrink-0" />
      <span className="truncate">Taken by {name}</span>
    </span>
  )
}

type PendingChange = {
  itemIds: string[]
  toStatus: OrderItemStatus
  title: string
  confirmLabel: string
  kind: 'advance' | 'revert'
}

// One item — advance ahead of its round (e.g. served early) or undo a mistake.
function ItemRow({
  item,
  onRequest,
}: {
  item: QueueItem
  onRequest: (change: PendingChange) => void
}) {
  const nextStatus = NEXT_ITEM_STATUS[item.status]
  const prevStatus = PREV_ITEM_STATUS[item.status]
  const isInProgress = item.status === 'in_progress'
  const isReady = item.status === 'ready'

  return (
    <div className="pl-5 pr-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
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
            {isInProgress && <span className="shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse" />}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {nextStatus && (
            <button
              onClick={() =>
                onRequest({
                  itemIds: [item.id],
                  toStatus: nextStatus,
                  title: `${ITEM_ACTION_LABEL[item.status]} — ${item.quantity}× ${item.menu_items?.name ?? 'item'}?`,
                  confirmLabel: ITEM_ACTION_LABEL[item.status] ?? 'Confirm',
                  kind: 'advance',
                })
              }
              className="rounded-lg min-h-[44px] px-3 flex items-center justify-center gap-1.5 border border-border bg-background text-xs font-bold text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
            >
              {ITEM_ACTION_LABEL[item.status]}
            </button>
          )}
          {prevStatus && (
            <button
              onClick={() =>
                onRequest({
                  itemIds: [item.id],
                  toStatus: prevStatus,
                  title: `Revert — ${item.quantity}× ${item.menu_items?.name ?? 'item'}?`,
                  confirmLabel: 'Revert',
                  kind: 'revert',
                })
              }
              aria-label="Revert status"
              className="rounded-lg min-h-[44px] min-w-[44px] px-3 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Undo2 size={15} />
            </button>
          )}
        </div>
      </div>
      {item.notes && (
        <p className="text-xs text-muted-foreground mt-1 pl-8 leading-snug">{item.notes}</p>
      )}
    </div>
  )
}

// One round (= one order) inside a tab card: its own timer, status, items and
// per-status bulk buttons. Status lives at the round level.
function RoundSection({
  roundItems,
  index,
  showHeader,
  onRequest,
}: {
  roundItems: QueueItem[]
  index: number
  showHeader: boolean
  onRequest: (change: PendingChange) => void
}) {
  const round = roundItems[0]?.orders
  const createdAt = round?.created_at ?? new Date().toISOString()
  const taker = round?.taker?.full_name ?? null
  const ageMinutes = useAgeMinutes(createdAt)
  const isUrgent = ageMinutes >= 15

  // Bulk advance buttons — only when 2+ items share a status (otherwise the
  // per-item button already covers it).
  const bulkButtons = BULK_STATUS_ORDER.flatMap((status) => {
    const next = NEXT_ITEM_STATUS[status]
    if (!next) return []
    const ids = roundItems.filter((i) => i.status === status).map((i) => i.id)
    if (ids.length < 2) return []
    return [{ status, next, ids }]
  })

  return (
    <div>
      {showHeader && (
        <div className="pl-5 pr-4 py-2 bg-muted/30 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Round {index + 1}
              <span className="ml-2 font-medium normal-case tracking-normal tabular-nums">
                {formatTime(createdAt)}
              </span>
            </span>
            {taker && <TakerLabel name={taker} />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TicketAgeIndicator createdAt={createdAt} />
            <StatusPill items={roundItems} isUrgent={isUrgent} />
          </div>
        </div>
      )}

      {!showHeader && taker && (
        <div className="pl-5 pr-4 pt-2.5 pb-0.5">
          <TakerLabel name={taker} />
        </div>
      )}

      {round?.notes && (
        <div className="pl-5 pr-4 py-2 bg-muted/40 flex items-start gap-2">
          <Flame size={13} className="text-muted-foreground mt-px shrink-0" />
          <p className="text-xs font-semibold text-foreground leading-snug">{round.notes}</p>
        </div>
      )}

      <div className="divide-y divide-border/50">
        {roundItems.map((item) => (
          <ItemRow key={item.id} item={item} onRequest={onRequest} />
        ))}
      </div>

      {bulkButtons.length > 0 && (
        <div className="pl-5 pr-4 pt-2 pb-3 flex flex-col gap-2">
          {bulkButtons.map(({ status, next, ids }) => {
            const isServe = next === 'served'
            const label = ITEM_ACTION_LABEL[status] ?? 'Advance'
            const count = ids.length
            return (
              <button
                key={status}
                onClick={() =>
                  onRequest({
                    itemIds: ids,
                    toStatus: next,
                    title: `${label} — ${count} item${count !== 1 ? 's' : ''} in round ${index + 1}?`,
                    confirmLabel: label,
                    kind: 'advance',
                  })
                }
                className={`rounded-lg py-3 text-sm font-bold tracking-wide transition-all duration-150 min-h-[48px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.98] ${
                  isServe
                    ? 'bg-foreground hover:bg-foreground/90 text-background'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isServe ? <CheckCheck size={16} strokeWidth={2.5} /> : <Flame size={15} strokeWidth={2.5} />}
                <span>{label} all ({count})</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabCard({
  tabName,
  tabItems,
  onRequest,
}: {
  tabName: string
  tabItems: QueueItem[]
  onRequest: (change: PendingChange) => void
}) {
  // Group the tab's items into rounds (one order = one round), oldest first.
  const roundsMap = tabItems.reduce<Record<string, QueueItem[]>>((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {})
  const rounds = Object.values(roundsMap).sort(
    (a, b) =>
      new Date(a[0]?.orders?.created_at ?? 0).getTime() -
      new Date(b[0]?.orders?.created_at ?? 0).getTime()
  )

  const oldestCreatedAt = rounds[0]?.[0]?.orders?.created_at ?? new Date().toISOString()
  const hasInProgress = tabItems.some((i) => i.status === 'in_progress')
  const allReady = tabItems.every((i) => i.status === 'ready')
  const totalItems = tabItems.reduce((sum, i) => sum + i.quantity, 0)
  const ageMinutes = useAgeMinutes(oldestCreatedAt)
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

  const multiRound = rounds.length > 1

  return (
    <div className={`surface-raised relative flex flex-col rounded-xl border-2 ${cardBorder} bg-card overflow-hidden`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${accentStripe}`} />
      {isUrgent && <div className="absolute top-0 inset-x-0 h-px bg-destructive/60" />}

      <div className={`${headerBg} pl-5 pr-4 py-3 flex items-start justify-between gap-3`}>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold tracking-tight leading-none truncate">{tabName}</p>
          <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
            {multiRound ? `${rounds.length} rounds · ` : ''}opened {formatTime(oldestCreatedAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
          <TicketAgeIndicator createdAt={oldestCreatedAt} />
          {!multiRound && <StatusPill items={tabItems} isUrgent={isUrgent} />}
        </div>
      </div>

      <div className="flex-1">
        {rounds.map((roundItems, idx) => (
          <div key={roundItems[0]?.order_id ?? idx} className={idx > 0 ? 'border-t-2 border-border/70' : ''}>
            <RoundSection
              roundItems={roundItems}
              index={idx}
              showHeader={multiRound}
              onRequest={onRequest}
            />
          </div>
        ))}
      </div>

      <div className="pl-5 pr-4 py-2.5 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
          {multiRound ? ` · ${rounds.length} rounds` : ''}
        </span>
        {multiRound && <StatusPill items={tabItems} isUrgent={isUrgent} />}
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

  // Group items by tab so each card is one place to deliver to. Grouping is
  // visual only — status actions stay scoped to each round inside the card.
  const tabGroups = items.reduce<Record<string, QueueItem[]>>((acc, item) => {
    const key = item.orders?.tabs?.id ?? item.order_id
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  async function handleConfirm() {
    if (!pending) return
    const { itemIds, toStatus } = pending
    const result = await updateItemsStatus(itemIds, toStatus)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    const idSet = new Set(itemIds)
    // Optimistic: update locally, dropping anything that left the queue.
    setItems((prev) =>
      prev
        .map((i) => (idSet.has(i.id) ? { ...i, status: toStatus } : i))
        .filter((i) => QUEUE_STATUSES.includes(i.status))
    )
  }

  if (Object.keys(tabGroups).length === 0) {
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
        {Object.entries(tabGroups).map(([key, tabItems]) => (
          <TabCard
            key={key}
            tabName={tabItems[0]?.orders?.tabs?.name ?? 'Unknown'}
            tabItems={tabItems}
            onRequest={setPending}
          />
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

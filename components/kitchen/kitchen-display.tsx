'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateOrderItemStatus } from '@/app/actions/orders'
import { formatTime } from '@/lib/format'
import { toast } from 'sonner'
import { ChefHat, Clock, CheckCheck, Flame } from 'lucide-react'
import type { OrderItemStatus } from '@/lib/database.types'

interface KitchenItem {
  id: string
  order_id: string
  quantity: number
  status: OrderItemStatus
  notes: string | null
  created_at: string
  menu_items: { name: string } | null
  orders: {
    id: string
    status: string
    notes: string | null
    created_at: string
    venue_tables: { label: string } | null
    tabs: { name: string } | null
  } | null
}

const NEXT_ITEM_STATUS: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  ordered:     'in_progress',
  in_progress: 'ready',
}

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
      className={`flex items-center gap-1 text-xs font-medium tabular-nums ${
        urgent ? 'text-rose-400' : warning ? 'text-amber-400' : 'text-muted-foreground'
      }`}
    >
      <Clock size={11} />
      {mins}m
    </span>
  )
}

export function KitchenDisplay({ initialItems }: { initialItems: KitchenItem[] }) {
  const [items, setItems] = useState<KitchenItem[]>(initialItems)
  const [advancing, setAdvancing] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, async () => {
        const { data } = await supabase
          .from('order_items')
          .select(`*, menu_items(name), orders(id, status, notes, created_at, venue_tables(label), tabs(name))`)
          .in('status', ['ordered', 'in_progress'])
          .order('created_at', { ascending: true })
        if (data) setItems(data as KitchenItem[])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const orderGroups = items.reduce<Record<string, KitchenItem[]>>((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {})

  async function handleAdvance(item: KitchenItem) {
    const nextStatus = NEXT_ITEM_STATUS[item.status]
    if (!nextStatus) return
    setAdvancing((prev) => new Set(prev).add(item.id))
    const result = await updateOrderItemStatus(item.id, nextStatus)
    setAdvancing((prev) => { const s = new Set(prev); s.delete(item.id); return s })
    if (result.error) {
      toast.error(result.error)
    } else {
      setItems((prev) =>
        prev
          .map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
          .filter((i) => i.status !== 'ready')
      )
    }
  }

  if (Object.keys(orderGroups).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <ChefHat size={26} className="text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">All clear</p>
          <p className="text-sm mt-0.5">No pending orders — new tickets appear here in real-time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Object.entries(orderGroups).map(([orderId, groupItems]) => {
        const order = groupItems[0]?.orders
        const location = order?.venue_tables?.label ?? order?.tabs?.name ?? 'Unknown'
        const hasInProgress = groupItems.some((i) => i.status === 'in_progress')
        const allOrdered = groupItems.every((i) => i.status === 'ordered')
        const totalItems = groupItems.reduce((sum, i) => sum + i.quantity, 0)

        const borderColor = hasInProgress
          ? 'border-orange-400/70'
          : 'border-amber-400/70'

        const headerBg = hasInProgress
          ? 'bg-orange-500/10'
          : 'bg-amber-500/10'

        return (
          <div key={orderId} className={`surface-raised flex flex-col rounded-xl border-2 ${borderColor} bg-card overflow-hidden`}>
            {/* Ticket header */}
            <div className={`${headerBg} px-4 py-3 flex items-start justify-between gap-2`}>
              <div>
                <p className="text-lg font-bold tracking-tight leading-none">{location}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(order?.created_at ?? '')}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {order?.created_at && <TicketAgeIndicator createdAt={order.created_at} />}
                <span className="text-[10px] text-muted-foreground font-mono">#{orderId.slice(0, 6)}</span>
              </div>
            </div>

            {/* Order notes */}
            {order?.notes && (
              <div className="px-4 py-2 border-b border-amber-400/20 bg-amber-500/5">
                <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                  <Flame size={11} />
                  {order.notes}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 divide-y divide-border/60">
              {groupItems.map((item) => {
                const nextStatus = NEXT_ITEM_STATUS[item.status]
                const isLoading = advancing.has(item.id)
                const isInProgress = item.status === 'in_progress'

                return (
                  <div key={item.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`font-semibold text-base leading-tight ${isInProgress ? 'text-orange-300' : 'text-foreground'}`}>
                          <span className="text-muted-foreground mr-1">{item.quantity}×</span>
                          {item.menu_items?.name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                        )}
                      </div>
                      {isInProgress && (
                        <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      )}
                    </div>

                    {nextStatus && (
                      <button
                        onClick={() => handleAdvance(item)}
                        disabled={isLoading}
                        className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 ${
                          isInProgress
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-white'
                        }`}
                      >
                        {isLoading ? 'Updating…' : (
                          <>
                            {isInProgress ? <CheckCheck size={15} /> : <Flame size={15} />}
                            {isInProgress ? 'Mark Ready' : 'Start'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
              <span className={`text-xs font-medium ${allOrdered ? 'text-amber-500' : 'text-orange-400'}`}>
                {allOrdered ? 'Queued' : 'In Progress'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

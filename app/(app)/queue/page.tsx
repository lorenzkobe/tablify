import { createClient } from '@/lib/supabase/server'
import { QueueDisplay } from '@/components/queue/queue-display'
import { QUEUE_STATUSES } from '@/lib/order-status'
import { ChefHat, Wifi } from 'lucide-react'

export default async function QueuePage() {
  const supabase = await createClient()

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_items(name),
      orders(
        id,
        notes,
        created_at,
        tabs(id, name),
        taker:profiles!orders_taken_by_fkey(full_name)
      )
    `)
    .in('status', QUEUE_STATUSES)
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/12 text-orange-500 flex items-center justify-center shrink-0">
            <ChefHat size={19} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight leading-none">Queue</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Every order, in its place — tickets update in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 shrink-0">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 text-emerald-500" />
          <Wifi size={12} className="text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
        </div>
      </div>

      <QueueDisplay initialItems={orderItems ?? []} />
    </div>
  )
}

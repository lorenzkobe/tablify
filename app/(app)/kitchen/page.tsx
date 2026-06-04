import { createClient } from '@/lib/supabase/server'
import { KitchenDisplay } from '@/components/kitchen/kitchen-display'
import { ChefHat, Wifi } from 'lucide-react'

export default async function KitchenPage() {
  const supabase = await createClient()

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_items(name),
      orders(
        id,
        status,
        notes,
        created_at,
        venue_tables(label),
        tabs(name)
      )
    `)
    .in('status', ['ordered', 'in_progress'])
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <ChefHat size={17} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Kitchen Display</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Active order queue</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
          <Wifi size={12} />
          Live
        </span>
      </div>
      <KitchenDisplay initialItems={orderItems ?? []} />
    </div>
  )
}

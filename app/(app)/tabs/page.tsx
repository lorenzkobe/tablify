import { createClient } from '@/lib/supabase/server'
import { NewTabDialog } from '@/components/tabs/new-tab-dialog'
import { Clock, Receipt, User } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/format'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'

export default async function TabsPage() {
  const supabase = await createClient()
  const { data: tabs } = await supabase
    .from('tabs')
    .select('*, profiles(full_name), orders(id)')
    .order('created_at', { ascending: false })
    .limit(50)

  const openTabs = tabs?.filter((t) => t.status === 'open') ?? []
  const closedTabs = tabs?.filter((t) => t.status === 'closed') ?? []

  const totalActiveOrders = openTabs.reduce((sum, tab) => {
    return sum + ((tab.orders as Array<{ id: string }> | null)?.length ?? 0)
  }, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader title="Tabs" action={<NewTabDialog />} />

      {/* Summary stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Open tile — cyan accent left border */}
        <div className="surface-raised relative overflow-hidden rounded-xl border border-border bg-card px-4 py-3.5">
          <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-primary" />
          <p className="text-2xl font-bold tabular-nums tracking-tight text-primary">{openTabs.length}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Open</p>
          {totalActiveOrders > 0 && (
            <p className="text-[11px] text-primary/70 mt-1.5 tabular-nums">
              {totalActiveOrders} {totalActiveOrders === 1 ? 'round' : 'rounds'}
            </p>
          )}
        </div>

        {/* Closed tile — neutral */}
        <div className="surface-raised rounded-xl border border-border bg-card px-4 py-3.5">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{closedTabs.length}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Closed</p>
          {closedTabs.length > 0 && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5">today</p>
          )}
        </div>
      </div>

      {/* Open tabs */}
      {openTabs.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-0.5">Open</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {openTabs.map((tab) => {
              const totalOrders = (tab.orders as Array<{ id: string }> | null)?.length ?? 0
              const openerName = (tab.profiles as { full_name: string } | null)?.full_name

              return (
                <Link key={tab.id} href={`/tabs/${tab.id}`} className="block group">
                  <div className="surface-raised relative rounded-xl border border-primary/25 bg-primary/5 p-4 min-h-[108px] flex flex-col justify-between cursor-pointer transition-all duration-150 hover:border-primary/40 hover:bg-primary/8 active:scale-[0.98]">
                    {/* Live indicator */}
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-primary text-primary live-dot" />

                    {/* Tab name */}
                    <div className="pr-6">
                      <p className="font-semibold text-foreground text-base leading-snug tracking-tight">{tab.name}</p>
                    </div>

                    {/* Meta row */}
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        {openerName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                            <User size={10} className="shrink-0" />
                            <span className="truncate">{openerName}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock size={10} className="shrink-0" />
                          {formatDistanceToNow(tab.created_at)}
                        </p>
                      </div>

                      {/* Round count pill */}
                      <div className="shrink-0 text-right">
                        {totalOrders > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary tabular-nums">
                            {totalOrders} {totalOrders === 1 ? 'round' : 'rounds'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">No orders yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Closed tabs */}
      {closedTabs.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-0.5">Closed</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {closedTabs.map((tab) => {
              const openerName = (tab.profiles as { full_name: string } | null)?.full_name
              return (
                <Link key={tab.id} href={`/tabs/${tab.id}`} className="block group">
                  <div className="relative rounded-xl border border-border bg-card p-4 min-h-[96px] flex flex-col justify-between cursor-pointer transition-all duration-150 hover:bg-accent/40 active:scale-[0.98] opacity-55 hover:opacity-80">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground leading-snug tracking-tight truncate">{tab.name}</p>
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center justify-between mt-3 gap-2 min-w-0">
                      {openerName ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate min-w-0">
                          <User size={10} className="shrink-0" />
                          <span className="truncate">{openerName}</span>
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                        <Clock size={10} />
                        {formatDistanceToNow(tab.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!tabs?.length && (
        <div className="surface-raised rounded-xl border border-dashed border-border bg-card px-6 py-14 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-muted">
            <Receipt size={20} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No tabs open</p>
            <p className="text-xs text-muted-foreground max-w-[22ch]">Open a tab to track walk-up orders without a table.</p>
          </div>
        </div>
      )}
    </div>
  )
}

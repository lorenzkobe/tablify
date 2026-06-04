import { createClient } from '@/lib/supabase/server'
import { NewTabDialog } from '@/components/tabs/new-tab-dialog'
import { Clock, User } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/format'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'

export default async function TabsPage() {
  const supabase = await createClient()
  const { data: tabs } = await supabase
    .from('tabs')
    .select('*, profiles(full_name), orders(id, status)')
    .order('created_at', { ascending: false })
    .limit(50)

  const openTabs = tabs?.filter((t) => t.status === 'open') ?? []
  const closedTabs = tabs?.filter((t) => t.status === 'closed') ?? []

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader title="Tabs" action={<NewTabDialog />} />

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Open', value: openTabs.length, color: 'text-primary' },
          { label: 'Closed', value: closedTabs.length, color: '' },
        ].map(({ label, value, color }) => (
          <div key={label} className="surface-raised rounded-xl border border-border bg-card px-4 py-3 text-center">
            <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {openTabs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {openTabs.map((tab) => {
              const activeOrders = (tab.orders as Array<{ status: string }> | null)?.filter(
                (o) => o.status !== 'paid' && o.status !== 'cancelled'
              ).length ?? 0
              const openerName = (tab.profiles as { full_name: string } | null)?.full_name

              return (
                <Link key={tab.id} href={`/tabs/${tab.id}`}>
                  <div className="surface-raised relative rounded-xl border border-primary/30 bg-primary/10 p-4 min-h-[100px] flex flex-col justify-between cursor-pointer transition-transform active:scale-95 hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-primary text-lg leading-tight">{tab.name}</p>
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="space-y-0.5">
                        {openerName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User size={10} />
                            {openerName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(tab.created_at)}
                        </p>
                      </div>
                      {activeOrders > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                          {activeOrders} {activeOrders === 1 ? 'order' : 'orders'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {closedTabs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Closed</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {closedTabs.map((tab) => {
              const openerName = (tab.profiles as { full_name: string } | null)?.full_name
              return (
                <Link key={tab.id} href={`/tabs/${tab.id}`}>
                  <div className="relative rounded-xl border border-border bg-card p-4 min-h-[100px] flex flex-col justify-between cursor-pointer transition-all active:scale-95 hover:bg-accent/50 opacity-60">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight">{tab.name}</p>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {openerName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User size={10} />
                          {openerName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
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

      {!tabs?.length && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No tabs yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Open one to start taking walk-up orders.</p>
        </div>
      )}
    </div>
  )
}

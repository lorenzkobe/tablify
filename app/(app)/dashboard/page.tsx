import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Scroll, UtensilsCrossed, CheckCheck, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/format'
import { QUEUE_STATUSES } from '@/lib/order-status'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Superadmins have no venue of their own — send them to their console.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role === 'superadmin') redirect('/superadmin/organisations')
  }

  const [tabsRes, queueRes, recentRes] = await Promise.all([
    supabase.from('tabs').select('id').eq('status', 'open'),
    supabase.from('order_items').select('status').in('status', QUEUE_STATUSES),
    supabase
      .from('orders')
      .select('id, tab_id, created_at, tabs(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const openTabs = tabsRes.data?.length ?? 0
  const queueDepth = queueRes.data?.length ?? 0
  const readyCount = queueRes.data?.filter((i) => i.status === 'ready').length ?? 0
  const recentRounds = recentRes.data ?? []

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-10">
      <PageHeader
        title="Dashboard"
        description="Live overview of your venue"
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-primary text-primary" />
            Realtime
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {/* Open Tabs */}
        <Link href="/tabs" className="group block h-full">
          <div className="surface-raised h-full rounded-xl border border-border bg-card p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
                <Scroll size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{openTabs}</p>
            <p className="text-xs text-muted-foreground mt-1">Open Tabs</p>
          </div>
        </Link>

        {/* Queue depth */}
        <Link href="/queue" className="group block h-full">
          <div className="surface-raised h-full rounded-xl border border-border bg-card p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
                <UtensilsCrossed size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{queueDepth}</p>
            <p className="text-xs text-muted-foreground mt-1">In the Queue</p>
          </div>
        </Link>

        {/* Ready to serve */}
        <Link href="/queue" className="group block h-full">
          <div className="surface-raised h-full rounded-xl border border-border bg-card p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCheck size={17} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{readyCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to Serve</p>
          </div>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Rounds
          </h2>
          <Link
            href="/tabs"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View tabs <ArrowRight size={12} />
          </Link>
        </div>

        {recentRounds.length === 0 ? (
          <div className="rounded-xl border border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {recentRounds.map((round) => {
              const location = (round.tabs as { name: string } | null)?.name ?? 'Unknown'
              return (
                <Link
                  key={round.id}
                  href={`/tabs/${round.tab_id}`}
                  className="group flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
                >
                  <span className="w-0.5 self-stretch rounded-full shrink-0 bg-primary" />
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{location}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        #{round.id.slice(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 ml-3">
                      <Clock size={11} />
                      {formatDistanceToNow(round.created_at)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

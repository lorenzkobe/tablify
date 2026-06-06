import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderItemStatus, TabStatus } from '@/lib/database.types'

/**
 * Ink & Signal status palette — soft tinted background + accent text, one
 * source of truth. `dot` and `text` are exported for pages that render their
 * own indicators (accent strips, status dots) instead of full badges.
 */
// `tint` is a soft status background for full-surface bands (e.g. queue rows),
// distinct from `badge` which also carries a border + colored text.
type Tone = { badge: string; dot: string; text: string; tint: string }

const AMBER: Tone   = { badge: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400',     tint: 'bg-amber-500/[0.07]' }
const ORANGE: Tone  = { badge: 'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400',  dot: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400',  tint: 'bg-orange-500/[0.07]' }
const EMERALD: Tone = { badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', tint: 'bg-emerald-500/[0.07]' }
const NEUTRAL: Tone = { badge: 'border-border bg-muted text-muted-foreground',                                dot: 'bg-muted-foreground', text: 'text-muted-foreground',            tint: 'bg-transparent' }
const CYAN: Tone    = { badge: 'border-primary/20 bg-primary/10 text-primary',                                dot: 'bg-primary',     text: 'text-primary',                          tint: 'bg-primary/[0.07]' }
const ROSE: Tone    = { badge: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',          dot: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',      tint: 'bg-rose-500/[0.07]' }

export const ITEM_STATUS_TONE: Record<OrderItemStatus, Tone> = {
  ordered:     AMBER,
  in_progress: ORANGE,
  ready:       EMERALD,
  served:      NEUTRAL,
  returned:    ROSE,
}

const ITEM_LABEL: Record<OrderItemStatus, string> = {
  ordered: 'Ordered', in_progress: 'In Progress', ready: 'Ready',
  served: 'Served', returned: 'Returned',
}

export function ItemStatusBadge({ status }: { status: OrderItemStatus }) {
  return (
    <Badge variant="outline" className={cn(ITEM_STATUS_TONE[status].badge)}>
      {ITEM_LABEL[status]}
    </Badge>
  )
}

export function TabStatusBadge({ status }: { status: TabStatus }) {
  return (
    <Badge variant="outline" className={cn(status === 'open' ? CYAN.badge : NEUTRAL.badge)}>
      {status === 'open' ? 'Open' : 'Closed'}
    </Badge>
  )
}

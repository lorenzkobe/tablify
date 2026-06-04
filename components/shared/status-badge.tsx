import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderItemStatus, TableStatus, TabStatus } from '@/lib/database.types'

/**
 * Ink & Signal status palette — soft tinted background + accent text, one
 * source of truth. `dot` and `text` are exported for pages that render their
 * own indicators (accent strips, status dots) instead of full badges.
 */
type Tone = { badge: string; dot: string; text: string }

const AMBER: Tone   = { badge: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400' }
const ORANGE: Tone  = { badge: 'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400',  dot: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400' }
const EMERALD: Tone = { badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' }
const NEUTRAL: Tone = { badge: 'border-border bg-muted text-muted-foreground',                                dot: 'bg-muted-foreground', text: 'text-muted-foreground' }
const CYAN: Tone    = { badge: 'border-primary/20 bg-primary/10 text-primary',                                dot: 'bg-primary',     text: 'text-primary' }
const ROSE: Tone    = { badge: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',          dot: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400' }

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending:     AMBER,
  in_progress: ORANGE,
  ready:       EMERALD,
  served:      NEUTRAL,
  paid:        CYAN,
  cancelled:   ROSE,
}

const ORDER_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', in_progress: 'In Progress', ready: 'Ready',
  served: 'Served', paid: 'Paid', cancelled: 'Cancelled',
}

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

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn(ORDER_STATUS_TONE[status].badge)}>
      {ORDER_LABEL[status]}
    </Badge>
  )
}

export function ItemStatusBadge({ status }: { status: OrderItemStatus }) {
  return (
    <Badge variant="outline" className={cn(ITEM_STATUS_TONE[status].badge)}>
      {ITEM_LABEL[status]}
    </Badge>
  )
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <Badge variant="outline" className={cn(status === 'available' ? EMERALD.badge : AMBER.badge)}>
      {status === 'available' ? 'Available' : 'Occupied'}
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

import { Badge } from '@/components/ui/badge'
import type { OrderStatus, OrderItemStatus, TableStatus, TabStatus } from '@/lib/database.types'

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-amber-500 text-white hover:bg-amber-500' },
  in_progress: { label: 'In Progress', className: 'bg-orange-500 text-white hover:bg-orange-500' },
  ready:       { label: 'Ready',       className: 'bg-green-500 text-white hover:bg-green-500' },
  served:      { label: 'Served',      className: 'bg-slate-400 text-white hover:bg-slate-400' },
  paid:        { label: 'Paid',        className: 'border-sky-500 text-sky-600 dark:text-sky-400' },
  cancelled:   { label: 'Cancelled',   className: 'border-red-500 text-red-600 dark:text-red-400' },
}

const ITEM_STATUS_CONFIG: Record<OrderItemStatus, { label: string; className: string }> = {
  ordered:     { label: 'Ordered',     className: 'bg-amber-500 text-white hover:bg-amber-500' },
  in_progress: { label: 'In Progress', className: 'bg-orange-500 text-white hover:bg-orange-500' },
  ready:       { label: 'Ready',       className: 'bg-green-500 text-white hover:bg-green-500' },
  served:      { label: 'Served',      className: 'bg-slate-400 text-white hover:bg-slate-400' },
  returned:    { label: 'Returned',    className: 'bg-red-500 text-white hover:bg-red-500' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status]
  const isOutline = status === 'paid' || status === 'cancelled'
  return (
    <Badge variant={isOutline ? 'outline' : 'default'} className={config.className}>
      {config.label}
    </Badge>
  )
}

export function ItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const config = ITEM_STATUS_CONFIG[status]
  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  )
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <Badge
      variant={status === 'available' ? 'outline' : 'default'}
      className={
        status === 'available'
          ? 'border-green-500 text-green-600 dark:text-green-400'
          : 'bg-amber-500 text-white hover:bg-amber-500'
      }
    >
      {status === 'available' ? 'Available' : 'Occupied'}
    </Badge>
  )
}

export function TabStatusBadge({ status }: { status: TabStatus }) {
  return (
    <Badge
      variant={status === 'open' ? 'default' : 'outline'}
      className={
        status === 'open'
          ? 'bg-sky-600 text-white hover:bg-sky-600'
          : 'border-slate-400 text-muted-foreground'
      }
    >
      {status === 'open' ? 'Open' : 'Closed'}
    </Badge>
  )
}

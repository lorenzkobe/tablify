import type { OrderItemStatus } from '@/lib/database.types'

// Single source of truth for the item lifecycle. Status lives only on items
// and is advanced exclusively in the Queue.
export const ITEM_FLOW = ['ordered', 'in_progress', 'ready', 'served'] as const

// Forward transitions (one step).
export const NEXT_ITEM_STATUS: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  ordered:     'in_progress',
  in_progress: 'ready',
  ready:       'served',
}

// Backward transitions (one step) — used to revert mistakes.
export const PREV_ITEM_STATUS: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  in_progress: 'ordered',
  ready:       'in_progress',
  served:      'ready',
}

// Label for the forward action taken from a given status.
export const ITEM_ACTION_LABEL: Partial<Record<OrderItemStatus, string>> = {
  ordered:     'Start',
  in_progress: 'Mark Ready',
  ready:       'Mark Served',
}

// Statuses that still belong on the Queue board (anything not yet served/returned).
export const QUEUE_STATUSES: OrderItemStatus[] = ['ordered', 'in_progress', 'ready']

// Whether a transition is a legal single step (forward or backward).
export function isValidTransition(from: OrderItemStatus, to: OrderItemStatus): boolean {
  return NEXT_ITEM_STATUS[from] === to || PREV_ITEM_STATUS[from] === to
}

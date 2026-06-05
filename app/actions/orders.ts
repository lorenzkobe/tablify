'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrganisation, isOrgOpenNow } from '@/lib/organisation'
import { isValidTransition } from '@/lib/order-status'
import type { OrderItemStatus } from '@/lib/database.types'

// Create a "round" on a tab — a batch of items sent to the queue together.
export async function createOrder(data: {
  tabId: string
  notes?: string
  items: Array<{ menuItemId: string; quantity: number; unitPrice: number; notes?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const org = await getOrganisation()
  if (!org) return { error: 'No organisation assigned' }
  if (!isOrgOpenNow(org)) return { error: 'The bar is closed' }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tab_id: data.tabId,
      taken_by: user.id,
      notes: data.notes ?? null,
      organisation_id: org.id,
    })
    .select('id')
    .single()

  if (orderError || !order) return { error: orderError?.message ?? 'Failed to create order' }

  const itemRows = data.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    notes: item.notes ?? null,
    status: 'ordered' as OrderItemStatus,
    organisation_id: org.id,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(itemRows)
  if (itemsError) return { error: itemsError.message }

  revalidatePath('/tabs')
  revalidatePath('/queue')
  revalidatePath('/dashboard')

  return { orderId: order.id }
}

// Advance a batch of items that share the same current status (one step each),
// recording who did it. Used by the Queue's per-status bulk buttons.
export async function updateItemsStatus(itemIds: string[], toStatus: OrderItemStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (itemIds.length === 0) return { error: 'No items selected' }

  const { data: current, error: readError } = await supabase
    .from('order_items')
    .select('id, status')
    .in('id', itemIds)

  if (readError || !current) return { error: readError?.message ?? 'Items not found' }

  const valid = current.filter((item) => isValidTransition(item.status, toStatus))
  if (valid.length === 0) return { error: 'Invalid status change' }

  const validIds = valid.map((item) => item.id)
  const { error } = await supabase
    .from('order_items')
    .update({ status: toStatus })
    .in('id', validIds)

  if (error) return { error: error.message }

  await supabase.from('status_events').insert(
    valid.map((item) => ({
      order_item_id: item.id,
      from_status: item.status,
      to_status: toStatus,
      actor: user.id,
    }))
  )

  revalidatePath('/queue')
  revalidatePath('/tabs')
  revalidatePath('/dashboard')

  return { updatedIds: validIds }
}

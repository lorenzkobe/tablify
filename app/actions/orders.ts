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

// Advance or revert a single item's status (one step), recording who did it.
export async function updateItemStatus(itemId: string, toStatus: OrderItemStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: current, error: readError } = await supabase
    .from('order_items')
    .select('status')
    .eq('id', itemId)
    .single()

  if (readError || !current) return { error: readError?.message ?? 'Item not found' }

  const fromStatus = current.status
  if (!isValidTransition(fromStatus, toStatus)) {
    return { error: 'Invalid status change' }
  }

  const { error } = await supabase
    .from('order_items')
    .update({ status: toStatus })
    .eq('id', itemId)

  if (error) return { error: error.message }

  await supabase.from('status_events').insert({
    order_item_id: itemId,
    from_status: fromStatus,
    to_status: toStatus,
    actor: user.id,
  })

  revalidatePath('/queue')
  revalidatePath('/tabs')
  revalidatePath('/dashboard')

  return {}
}

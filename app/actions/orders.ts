'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus, OrderItemStatus } from '@/lib/database.types'

export async function createOrder(data: {
  tableId?: string
  tabId?: string
  notes?: string
  items: Array<{ menuItemId: string; quantity: number; unitPrice: number; notes?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: data.tableId ?? null,
      tab_id: data.tabId ?? null,
      taken_by: user.id,
      notes: data.notes ?? null,
      status: 'pending',
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
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(itemRows)
  if (itemsError) return { error: itemsError.message }

  if (data.tableId) {
    await supabase
      .from('venue_tables')
      .update({ status: 'occupied' })
      .eq('id', data.tableId)
  }

  revalidatePath('/tables')
  revalidatePath('/dashboard')
  revalidatePath('/orders')

  return { orderId: order.id }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { error: error.message }

  if (status === 'paid' || status === 'cancelled') {
    const { data: order } = await supabase
      .from('orders')
      .select('table_id, tab_id')
      .eq('id', orderId)
      .single()

    if (order?.table_id) {
      const { data: otherOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', order.table_id)
        .not('id', 'eq', orderId)
        .not('status', 'in', '("paid","cancelled")')

      if (!otherOrders?.length) {
        await supabase
          .from('venue_tables')
          .update({ status: 'available' })
          .eq('id', order.table_id)
      }
    }

    if (order?.tab_id) {
      await supabase
        .from('tabs')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', order.tab_id)
    }
  }

  revalidatePath('/orders')
  revalidatePath('/tables')
  revalidatePath('/dashboard')

  return {}
}

export async function updateOrderItemStatus(itemId: string, status: OrderItemStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('order_items')
    .update({ status })
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath('/kitchen')
  revalidatePath('/orders')

  return {}
}

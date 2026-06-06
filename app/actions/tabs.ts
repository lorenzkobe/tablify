'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrganisation, isOrgOpenNow } from '@/lib/organisation'
import type { OrderItemStatus } from '@/lib/database.types'

export async function createTab(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const org = await getOrganisation()
  if (!org) return { error: 'No organisation assigned' }
  if (!isOrgOpenNow(org)) return { error: 'The bar is closed' }

  const { data: tab, error } = await supabase
    .from('tabs')
    .insert({ name: name.trim(), opened_by: user.id, status: 'open', organisation_id: org.id })
    .select('id')
    .single()

  if (error || !tab) return { error: error?.message ?? 'Failed to create tab' }

  revalidatePath('/tabs')
  revalidatePath('/dashboard')

  return { tabId: tab.id }
}

export async function closeTab(tabId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Closing a bill is a cash action — admins and cashiers only.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'cashier') {
    return { error: 'Only an admin or cashier can close a bill' }
  }

  // Authoritative balance: sum of non-returned line items across the tab's rounds.
  const { data: rounds } = await supabase
    .from('orders')
    .select('order_items(quantity, unit_price, status)')
    .eq('tab_id', tabId)

  const balance = (rounds ?? []).reduce((sum, round) => {
    const items = (round.order_items ?? []) as { quantity: number; unit_price: number; status: OrderItemStatus }[]
    return sum + items.reduce((s, i) => (i.status === 'returned' ? s : s + i.quantity * i.unit_price), 0)
  }, 0)

  // An empty (zero-balance) tab leaves no bill behind — hard delete it instead of
  // littering the list with closed shells. orders.tab_id is ON DELETE SET NULL and
  // orders require a location, so the child rounds must be removed first (which
  // cascades to order_items and status_events).
  if (balance === 0) {
    const { error: roundsError } = await supabase.from('orders').delete().eq('tab_id', tabId)
    if (roundsError) return { error: roundsError.message }

    const { error: tabError } = await supabase.from('tabs').delete().eq('id', tabId)
    if (tabError) return { error: tabError.message }

    revalidatePath('/tabs')
    revalidatePath('/dashboard')

    return { deleted: true }
  }

  const { error } = await supabase
    .from('tabs')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', tabId)

  if (error) return { error: error.message }

  revalidatePath('/tabs')
  revalidatePath('/dashboard')

  return { deleted: false }
}

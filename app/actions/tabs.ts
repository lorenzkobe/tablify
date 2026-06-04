'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrganisation, isOrgOpenNow } from '@/lib/organisation'

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

  // Closing a bill is a cash action — admins only.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only an admin can close a bill' }
  }

  const { error } = await supabase
    .from('tabs')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', tabId)

  if (error) return { error: error.message }

  revalidatePath('/tabs')
  revalidatePath('/dashboard')

  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/database.types'

export async function inviteUser(email: string, fullName: string, role: Role) {
  // The new staff member joins the inviting admin's organisation.
  const caller = await createClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await caller
    .from('profiles')
    .select('organisation_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) return { error: 'No organisation assigned' }

  const supabase = await createAdminClient()

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role, organisation_id: profile.organisation_id },
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

export async function updateUserRole(userId: string, role: Role) {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

export async function deleteUser(userId: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

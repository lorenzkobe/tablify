'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import type { Role } from '@/lib/database.types'

// Admins manage crew and cashiers, but cannot touch a fellow admin's account.
// Returns an error string if the caller (an admin) is not allowed to act on the
// target, otherwise null. Superadmins use the separate superadmin actions and
// never reach here.
async function guardAdminManagingPeer(targetUserId: string) {
  const caller = await getCurrentProfile()
  if (!caller) return 'Not authenticated'
  if (caller.role !== 'admin') return 'Not authorised'
  if (caller.id === targetUserId) return null

  const admin = await createAdminClient()
  const { data: target } = await admin
    .from('profiles')
    .select('role')
    .eq('id', targetUserId)
    .single()

  if (target?.role === 'admin') return 'You cannot manage another admin'
  return null
}

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

  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role, organisation_id: profile.organisation_id },
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/users')

  // The profiles row is created by the handle_new_user trigger on the auth
  // insert above, so it already exists — read it back to update the UI without
  // refetching the whole list.
  const { data: created } = await supabase
    .from('profiles')
    .select()
    .eq('id', invited.user.id)
    .single()

  return { data: created }
}

export async function updateUserRole(userId: string, role: Role) {
  const denied = await guardAdminManagingPeer(userId)
  if (denied) return { error: denied }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { data }
}

export async function deleteUser(userId: string) {
  const denied = await guardAdminManagingPeer(userId)
  if (denied) return { error: denied }

  const supabase = await createAdminClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { data: { id: userId } }
}

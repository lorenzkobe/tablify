'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/database.types'

export async function inviteUser(email: string, fullName: string, role: Role) {
  const supabase = await createAdminClient()

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role },
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

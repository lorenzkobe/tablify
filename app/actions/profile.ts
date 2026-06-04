'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile({
  fullName,
  currentPassword,
  newPassword,
}: {
  fullName: string
  currentPassword?: string
  newPassword?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = fullName.trim()
  if (!name) return { error: 'Name cannot be empty' }

  if (newPassword) {
    if (!currentPassword) return { error: 'Enter your current password' }
    if (!user.email) return { error: 'No email associated with this account' }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (reauthError) return { error: 'Current password is incorrect' }

    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
    if (passwordError) return { error: passwordError.message }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: name })
    .eq('id', user.id)
  if (profileError) return { error: profileError.message }

  await supabase.auth.updateUser({ data: { full_name: name } })

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return {}
}

'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { IMPERSONATION_COOKIE, type ImpersonationStash } from '@/lib/impersonation'

export async function logout() {
  // Clear any live impersonation before signing out, so a stale cookie can
  // never resurrect the "Signed in as" banner after logging back in.
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (raw) {
    try {
      const stash = JSON.parse(raw) as ImpersonationStash
      const admin = await createAdminClient()
      await admin
        .from('active_impersonations')
        .delete()
        .eq('superadmin_id', stash.superadmin_id)
    } catch {}
    cookieStore.delete(IMPERSONATION_COOKIE)
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

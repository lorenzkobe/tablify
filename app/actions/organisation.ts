'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Admin self-service: edit the operational settings of the caller's OWN
// organisation. Uses the RLS-scoped client (not the service role) — the
// "Admin updates own organisation" policy in migration 006 pins the write to
// the admin's org, and we only ever send the allowed columns.
export async function updateMyOrganisation(data: {
  name?: string
  timezone?: string
  openTime?: string
  closeTime?: string
  currency?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organisation_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden' as const }
  if (!profile.organisation_id) return { error: 'You are not assigned to an organisation' as const }

  const { error } = await supabase
    .from('organisations')
    .update({
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.openTime !== undefined && { open_time: data.openTime }),
      ...(data.closeTime !== undefined && { close_time: data.closeTime }),
      ...(data.currency !== undefined && { currency: data.currency }),
    })
    .eq('id', profile.organisation_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/settings')
  return {}
}

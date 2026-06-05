'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { IMPERSONATION_COOKIE, type ImpersonationStash } from '@/lib/impersonation'
import { isInvalidSameDayClose } from '@/lib/format'

const SAME_DAY_CLOSE_ERROR =
  'Closing time must be after the opening time, or marked as closing the next day.'

// Guard: confirm the caller is a superadmin before any service-role use.
async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') return { error: 'Forbidden' as const }
  return { user }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createOrganisation(data: {
  name: string
  timezone?: string
  openTime?: string
  closeTime?: string
  closesNextDay?: boolean
  currency?: string
}) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  if (
    data.openTime &&
    data.closeTime &&
    data.closesNextDay !== undefined &&
    isInvalidSameDayClose(data.openTime, data.closeTime, data.closesNextDay)
  ) {
    return { error: SAME_DAY_CLOSE_ERROR }
  }

  const supabase = await createAdminClient()
  const { data: created, error } = await supabase.from('organisations').insert({
    name: data.name.trim(),
    slug: slugify(data.name) || crypto.randomUUID().slice(0, 8),
    ...(data.timezone && { timezone: data.timezone }),
    ...(data.openTime && { open_time: data.openTime }),
    ...(data.closeTime && { close_time: data.closeTime }),
    ...(data.closesNextDay !== undefined && { closes_next_day: data.closesNextDay }),
    ...(data.currency && { currency: data.currency }),
  })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/superadmin/organisations')
  return { data: created }
}

export async function updateOrganisation(
  id: string,
  data: {
    name?: string
    timezone?: string
    openTime?: string
    closeTime?: string
    closesNextDay?: boolean
    currency?: string
  },
) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  if (
    data.openTime &&
    data.closeTime &&
    data.closesNextDay !== undefined &&
    isInvalidSameDayClose(data.openTime, data.closeTime, data.closesNextDay)
  ) {
    return { error: SAME_DAY_CLOSE_ERROR }
  }

  const supabase = await createAdminClient()
  const { data: updated, error } = await supabase
    .from('organisations')
    .update({
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.openTime !== undefined && { open_time: data.openTime }),
      ...(data.closeTime !== undefined && { close_time: data.closeTime }),
      ...(data.closesNextDay !== undefined && { closes_next_day: data.closesNextDay }),
      ...(data.currency !== undefined && { currency: data.currency }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/superadmin/organisations')
  return { data: updated }
}

// Permanently delete an organisation. The FKs are configured so this cascade-
// deletes all of the org's owned data, while its members are detached (their
// organisation_id is set to NULL via ON DELETE SET NULL) rather than removed.
export async function deleteOrganisation(id: string) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('organisations').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/superadmin/organisations')
  return { data: { id } }
}

export async function assignUserToOrg(userId: string, organisationId: string) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ organisation_id: organisationId })
    .eq('id', userId)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/superadmin/users')
  revalidatePath('/superadmin/organisations/[slug]', 'page')
  return { data }
}

// Remove a user from their organisation, leaving them unassigned.
export async function removeUserFromOrg(userId: string) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ organisation_id: null })
    .eq('id', userId)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/superadmin/users')
  revalidatePath('/superadmin/organisations/[slug]', 'page')
  return { data }
}

// Invite a brand-new user straight into a specific organisation. Unlike the
// admin invite (which derives the org from the caller), the superadmin has no
// org of their own, so the target org is passed explicitly.
export async function inviteUserToOrg(
  email: string,
  fullName: string,
  role: 'admin' | 'crew',
  organisationId: string,
) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  const supabase = await createAdminClient()
  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role, organisation_id: organisationId },
  })

  if (error) return { error: error.message }
  revalidatePath('/superadmin/users')
  revalidatePath('/superadmin/organisations/[slug]', 'page')

  // The handle_new_user trigger creates the profiles row on the auth insert
  // above; read it back so the caller can update the UI without refetching.
  const { data: created } = await supabase
    .from('profiles')
    .select()
    .eq('id', invited.user.id)
    .single()

  return { data: created }
}

// Set a user's org-level role. Superadmin can never be assigned via the UI.
export async function setUserRole(userId: string, role: 'admin' | 'crew') {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/superadmin/users')
  revalidatePath('/superadmin/organisations/[slug]', 'page')
  return { data }
}

// "Sign in as" — full act-as. Stashes the superadmin's session in an HttpOnly
// cookie, then establishes the target user's session on the cookie client so
// the rest of the app transparently sees the target user.
export async function signInAsUser(userId: string) {
  const guard = await requireSuperadmin()
  if ('error' in guard) return { error: guard.error }
  const superadmin = guard.user

  const cookieStore = await cookies()
  if (cookieStore.get(IMPERSONATION_COOKIE)) {
    return { error: 'Already impersonating — stop first' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'No active session' }

  const admin = await createAdminClient()

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId)
  if (targetError || !target.user?.email) {
    return { error: targetError?.message ?? 'Target user has no email' }
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: target.user.email,
  })
  if (linkError || !link.properties?.hashed_token) {
    return { error: linkError?.message ?? 'Could not generate sign-in link' }
  }

  // Stash the superadmin's own session before switching.
  const stash: ImpersonationStash = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    superadmin_id: superadmin.id,
    target_user_id: userId,
  }
  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(stash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })

  // Establish the target's session — rewrites the sb-* auth cookies.
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  })
  if (verifyError) {
    cookieStore.delete(IMPERSONATION_COOKIE)
    return { error: verifyError.message }
  }

  // Record the live impersonation — the authoritative state that gates the
  // banner (the cookie only holds the restore tokens).
  await admin.from('active_impersonations').upsert({
    superadmin_id: superadmin.id,
    target_user_id: userId,
  })

  await admin.from('impersonation_events').insert({
    superadmin_id: superadmin.id,
    target_user_id: userId,
    action: 'start',
  })

  redirect('/dashboard')
}

// Restore the superadmin's session and clear the impersonation stash.
export async function stopImpersonating() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (!raw) redirect('/dashboard')

  const stash = JSON.parse(raw) as ImpersonationStash

  const supabase = await createClient()
  await supabase.auth.setSession({
    access_token: stash.access_token,
    refresh_token: stash.refresh_token,
  })

  cookieStore.delete(IMPERSONATION_COOKIE)

  const admin = await createAdminClient()
  await admin
    .from('active_impersonations')
    .delete()
    .eq('superadmin_id', stash.superadmin_id)

  await admin.from('impersonation_events').insert({
    superadmin_id: stash.superadmin_id,
    target_user_id: stash.target_user_id,
    action: 'stop',
  })

  redirect('/superadmin/users')
}

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Per-request memoised auth + profile lookups.
//
// React's cache() dedupes by argument within a single server render, so the
// layout, the page, and any nested server component all share ONE Supabase Auth
// round-trip and ONE profiles query — instead of each independently calling
// auth.getUser() (a network hit to Supabase Auth) and re-querying profiles.
//
// Note: middleware runs in a separate invocation and cannot share this cache.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, organisation_id')
    .eq('id', user.id)
    .single()

  return data
})

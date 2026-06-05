import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { localMinutes, parseTime } from '@/lib/business-day'
import type { Organisation } from '@/lib/database.types'

// Sensible fallback so pages degrade gracefully if the caller has no org yet
// (e.g. a freshly bootstrapped superadmin, or before migration 004 backfill).
export const DEFAULT_ORG: Pick<Organisation, 'timezone' | 'open_time' | 'close_time' | 'currency'> = {
  timezone: 'Asia/Manila',
  open_time: '17:00',
  close_time: '03:00',
  currency: 'PHP',
}

// The organisation the current caller belongs to (RLS-scoped). null for a
// superadmin or unauthenticated request.
export async function getOrganisation(): Promise<Organisation | null> {
  // Reuses the request-cached profile, so this adds only the organisations
  // query — no extra auth round-trip or profiles lookup.
  const profile = await getCurrentProfile()
  if (!profile?.organisation_id) return null

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', profile.organisation_id)
    .single()

  return org ?? null
}

// Whether the venue is currently open, given its timezone + opening hours.
// Handles a close_time that crosses midnight (close <= open).
export function isOrgOpenNow(
  org: Pick<Organisation, 'timezone' | 'open_time' | 'close_time'>,
  now: Date = new Date(),
): boolean {
  const minutes = localMinutes(now.toISOString(), org.timezone)
  const open = parseTime(org.open_time)
  const close = parseTime(org.close_time)

  if (close <= open) {
    // Crosses midnight: open from open_time to 24:00, then 00:00 to close_time.
    return minutes >= open || minutes < close
  }
  return minutes >= open && minutes < close
}

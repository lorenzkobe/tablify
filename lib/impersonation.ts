// Shared constants for superadmin "Sign in as" impersonation.
// Kept out of the 'use server' action file (which may only export async fns)
// so the layout can import the cookie name too.

export const IMPERSONATION_COOKIE = 'tablify-impersonator'

// The superadmin's own session, stashed server-side while impersonating so
// "Stop impersonating" can restore it without a re-login.
export interface ImpersonationStash {
  access_token: string
  refresh_token: string
  superadmin_id: string
  target_user_id: string
}

// Whether the current session is a live impersonation of `currentUserId`.
// The HttpOnly cookie is the authoritative signal: it is set by signInAsUser
// and deleted on both stopImpersonating() and logout(), so it can never go
// stale across a re-login. Validating the stashed target against the current
// user ensures the banner only shows in the impersonated session itself.
export function isImpersonating(
  stashRaw: string | undefined,
  currentUserId: string,
): boolean {
  if (!stashRaw) return false
  try {
    const stash = JSON.parse(stashRaw) as ImpersonationStash
    return stash.target_user_id === currentUserId
  } catch {
    return false
  }
}

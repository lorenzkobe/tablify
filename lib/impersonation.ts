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

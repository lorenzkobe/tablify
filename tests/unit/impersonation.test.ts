import { describe, it, expect } from 'vitest'
import { isImpersonating, type ImpersonationStash } from '@/lib/impersonation'

describe('isImpersonating', () => {
  const stash: ImpersonationStash = {
    access_token: 'a',
    refresh_token: 'r',
    superadmin_id: 'super-1',
    target_user_id: 'target-1',
  }

  it('is true when the cookie targets the current user', () => {
    expect(isImpersonating(JSON.stringify(stash), 'target-1')).toBe(true)
  })

  it('is false when there is no cookie', () => {
    expect(isImpersonating(undefined, 'target-1')).toBe(false)
  })

  it('is false when the cookie targets a different user', () => {
    // Guards against showing the banner to the superadmin themselves, or to
    // some other user, if a stray cookie were present.
    expect(isImpersonating(JSON.stringify(stash), 'someone-else')).toBe(false)
  })

  it('is false when the cookie value is malformed', () => {
    expect(isImpersonating('not-json', 'target-1')).toBe(false)
  })
})

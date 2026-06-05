import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/shared/sidebar-nav'
import { ImpersonationBanner } from '@/components/superadmin/impersonation-banner'
import { IMPERSONATION_COOKIE, isImpersonating } from '@/lib/impersonation'
import { Toaster } from 'sonner'
import type { Role } from '@/lib/database.types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'crew') as Role
  const fullName = profile?.full_name ?? ''

  // The HttpOnly cookie is the authoritative signal for the current session —
  // it's deleted on both stopImpersonating() and logout(), so it can't go
  // stale across a re-login. (active_impersonations remains the cross-session
  // audit record but isn't needed to gate this banner.)
  const cookieStore = await cookies()
  const impersonating = isImpersonating(cookieStore.get(IMPERSONATION_COOKIE)?.value, user.id)

  return (
    <div className="flex min-h-screen">
      <AppNav role={role} fullName={fullName} />
      {/* pt-14 pb-16 reserve space for mobile top/bottom bars; removed on md+ */}
      <main className="flex-1 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0">
        {impersonating && <ImpersonationBanner name={fullName} />}
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/shared/sidebar-nav'
import { Toaster } from 'sonner'
import type { Role } from '@/lib/database.types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'server') as Role

  return (
    <div className="flex min-h-screen">
      <AppNav role={role} />
      {/* pt-14 pb-16 reserve space for mobile top/bottom bars; removed on md+ */}
      <main className="flex-1 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}

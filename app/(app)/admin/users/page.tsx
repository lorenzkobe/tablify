import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserManager } from '@/components/admin/user-manager'
import { Users } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  const count = profiles?.length ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
          <Users size={17} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Staff</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {count} team member{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <UserManager users={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}

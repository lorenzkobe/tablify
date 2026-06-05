import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { UserManager } from '@/components/admin/user-manager'

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  const count = profiles?.length ?? 0

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">
          {count} team member{count !== 1 ? 's' : ''}
        </p>
      </div>

      <UserManager users={profiles ?? []} currentUserId={profile.id} />
    </div>
  )
}

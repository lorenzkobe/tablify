import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { GlobalUserManager } from '@/components/superadmin/global-user-manager'

export default async function SuperadminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  // Superadmin RLS lets us read every profile and organisation.
  const [usersRes, orgsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('organisations').select('*').order('name'),
  ])

  const count = usersRes.data?.length ?? 0

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="All Users"
        description={`${count} user${count !== 1 ? 's' : ''} across all organisations`}
      />
      <GlobalUserManager
        users={usersRes.data ?? []}
        organisations={orgsRes.data ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}

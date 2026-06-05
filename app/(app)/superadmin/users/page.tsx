import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { GlobalUserManager } from '@/components/superadmin/global-user-manager'

export default async function SuperadminUsersPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'superadmin') redirect('/dashboard')

  const supabase = await createClient()

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
        currentUserId={profile.id}
      />
    </div>
  )
}

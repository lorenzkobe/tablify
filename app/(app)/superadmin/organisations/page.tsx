import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { OrganisationManager } from '@/components/superadmin/organisation-manager'

export default async function SuperadminOrganisationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const { data: organisations } = await supabase
    .from('organisations')
    .select('*')
    .order('created_at')

  const count = organisations?.length ?? 0

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Organisations"
        description={`${count} business${count !== 1 ? 'es' : ''}`}
      />
      <OrganisationManager organisations={organisations ?? []} />
    </div>
  )
}

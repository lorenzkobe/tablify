import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { OrganisationManager } from '@/components/superadmin/organisation-manager'

export default async function SuperadminOrganisationsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'superadmin') redirect('/dashboard')

  const supabase = await createClient()
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

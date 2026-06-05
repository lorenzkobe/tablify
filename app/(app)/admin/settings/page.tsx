import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { PageHeader } from '@/components/shared/page-header'
import { OrgSettingsForm } from '@/components/admin/org-settings-form'
import { getOrganisation } from '@/lib/organisation'

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const org = await getOrganisation()

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto space-y-6">
      <PageHeader title="Settings" description="Your organisation's details and trading hours" />
      {org ? (
        <OrgSettingsForm organisation={org} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No organisation assigned</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ask a superadmin to assign you to a business.
          </p>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import { formatClock } from '@/lib/format'
import { OrgEditButton } from '@/components/superadmin/org-edit-button'
import { OrgDeleteButton } from '@/components/superadmin/org-delete-button'
import { OrgMemberManager } from '@/components/superadmin/org-member-manager'

export default async function SuperadminOrganisationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const { data: org } = await supabase
    .from('organisations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  const [membersRes, orgsRes, unassignedRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('organisation_id', org.id).order('created_at'),
    supabase.from('organisations').select('*').order('name'),
    supabase.from('profiles').select('*').is('organisation_id', null).order('full_name'),
  ])

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="space-y-3">
        <Link
          href="/superadmin/organisations"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          Organisations
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{org.name}</h1>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock size={13} />
              <span>
                {formatClock(org.open_time)} – {formatClock(org.close_time)}
                {org.closes_next_day && (
                  <span className="ml-1 text-primary/80">+1d</span>
                )}
              </span>
              · {org.timezone} · {org.currency}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <OrgEditButton org={org} />
            <OrgDeleteButton org={org} memberCount={membersRes.data?.length ?? 0} />
          </div>
        </div>
      </div>

      <OrgMemberManager
        members={membersRes.data ?? []}
        organisationId={org.id}
        organisations={orgsRes.data ?? []}
        unassignedUsers={unassignedRes.data ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}

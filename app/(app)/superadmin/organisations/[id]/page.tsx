import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import { formatClock } from '@/lib/format'
import { OrgEditButton } from '@/components/superadmin/org-edit-button'
import { OrgMemberManager } from '@/components/superadmin/org-member-manager'

export default async function SuperadminOrganisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const [orgRes, membersRes, orgsRes] = await Promise.all([
    supabase.from('organisations').select('*').eq('id', id).single(),
    supabase.from('profiles').select('*').eq('organisation_id', id).order('created_at'),
    supabase.from('organisations').select('*').order('name'),
  ])

  const org = orgRes.data
  if (!org) notFound()

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
          <OrgEditButton org={org} />
        </div>
      </div>

      <OrgMemberManager
        members={membersRes.data ?? []}
        organisationId={org.id}
        organisations={orgsRes.data ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}

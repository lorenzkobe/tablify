'use client'

import { useState } from 'react'
import { assignUserToOrg, setUserRole, signInAsUser } from '@/app/actions/superadmin'
import { ROLE_CONFIG } from '@/components/admin/user-manager'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Initials } from '@/components/shared/initials'
import { toast } from 'sonner'
import { Eye, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile, Organisation } from '@/lib/database.types'

const UNASSIGNED = '__none__'

export function GlobalUserManager({
  users: initialUsers,
  organisations,
  currentUserId,
}: {
  users: Profile[]
  organisations: Organisation[]
  currentUserId: string
}) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingSignIn, setPendingSignIn] = useState<{ id: string; name: string } | null>(null)

  const orgName = (id: string | null) =>
    organisations.find((o) => o.id === id)?.name ?? 'Unassigned'

  async function changeOrg(userId: string, organisationId: string) {
    setBusyId(userId)
    const result = await assignUserToOrg(userId, organisationId)
    setBusyId(null)
    if (result.error || !result.data) {
      toast.error(result.error ?? 'Something went wrong')
      return
    }
    const saved = result.data
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)))
    toast.success('Organisation assigned')
  }

  async function changeRole(userId: string, role: 'admin' | 'crew') {
    setBusyId(userId)
    const result = await setUserRole(userId, role)
    setBusyId(null)
    if (result.error || !result.data) {
      toast.error(result.error ?? 'Something went wrong')
      return
    }
    const saved = result.data
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)))
    toast.success('Role updated')
  }

  async function runSignIn() {
    if (!pendingSignIn) return
    const result = await signInAsUser(pendingSignIn.id)
    // On success the action redirects and this never resolves.
    if (result?.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
        {users.map((u) => {
          const config = ROLE_CONFIG[u.role]
          const isSelf = u.id === currentUserId
          const isSuperadmin = u.role === 'superadmin'
          const disabled = busyId === u.id

          return (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Initials name={u.full_name} className={cn('w-10 h-10 ring-2', config.avatarRing)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm leading-snug truncate">{u.full_name}</p>
                    {isSelf && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                    {!isSuperadmin && (
                      <span className="text-xs text-muted-foreground truncate">{orgName(u.organisation_id)}</span>
                    )}
                  </div>
                </div>
              </div>

              {!isSuperadmin && (
                <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0 flex-wrap">
                  <Select
                    value={u.organisation_id ?? UNASSIGNED}
                    onValueChange={(val) => {
                      if (val && val !== UNASSIGNED && val !== u.organisation_id) changeOrg(u.id, val)
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[9rem] h-9 text-xs">
                      <span className="flex-1 text-left truncate">{orgName(u.organisation_id)}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {organisations.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={u.role}
                    onValueChange={(val) => {
                      if (val && val !== u.role) changeRole(u.id, val as 'admin' | 'crew')
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[6.5rem] h-9 text-xs">
                      <span className="flex-1 text-left truncate">{config.label}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="crew">Crew</SelectItem>
                    </SelectContent>
                  </Select>

                  {!isSelf && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingSignIn({ id: u.id, name: u.full_name })}
                      className="gap-1.5 h-9 text-xs"
                    >
                      <Eye size={14} />
                      Sign in as
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {users.length === 0 && (
          <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Users size={22} />
            </div>
            <p className="text-sm font-medium text-foreground">No users yet</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingSignIn}
        onOpenChange={(o) => !o && setPendingSignIn(null)}
        tone="warning"
        title="Sign in as this user?"
        description={
          pendingSignIn && (
            <>
              You will be signed in as <span className="font-medium text-foreground">{pendingSignIn.name}</span> and
              act fully as them. A banner lets you stop and return to your superadmin session.
            </>
          )
        }
        confirmLabel="Sign in as"
        loadingLabel="Switching…"
        icon={<Eye size={18} />}
        onConfirm={runSignIn}
      />
    </div>
  )
}

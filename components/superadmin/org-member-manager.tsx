'use client'

import { useState } from 'react'
import {
  assignUserToOrg,
  setUserRole,
  signInAsUser,
  removeUserFromOrg,
  inviteUserToOrg,
} from '@/app/actions/superadmin'
import { ROLE_CONFIG } from '@/components/admin/user-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Initials } from '@/components/shared/initials'
import { toast } from 'sonner'
import { Eye, Users, Plus, UserMinus, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile, Organisation } from '@/lib/database.types'

export function OrgMemberManager({
  members: initialMembers,
  organisationId,
  organisations,
  unassignedUsers: initialUnassigned,
  currentUserId,
}: {
  members: Profile[]
  organisationId: string
  organisations: Organisation[]
  unassignedUsers: Profile[]
  currentUserId: string
}) {
  const [members, setMembers] = useState<Profile[]>(initialMembers)
  const [unassignedUsers, setUnassignedUsers] = useState<Profile[]>(initialUnassigned)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingSignIn, setPendingSignIn] = useState<{ id: string; name: string } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'crew'>('crew')
  const [inviting, setInviting] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)

  const adminCount = members.filter((m) => m.role === 'admin').length
  const otherOrgs = organisations.filter((o) => o.id !== organisationId)

  async function changeRole(userId: string, next: 'admin' | 'crew') {
    setBusyId(userId)
    const result = await setUserRole(userId, next)
    setBusyId(null)
    if (result.error || !result.data) return void toast.error(result.error ?? 'Something went wrong')
    const saved = result.data
    setMembers((prev) => prev.map((m) => (m.id === saved.id ? saved : m)))
    toast.success('Role updated')
  }

  async function moveToOrg(userId: string, targetOrgId: string) {
    setBusyId(userId)
    const result = await assignUserToOrg(userId, targetOrgId)
    setBusyId(null)
    if (result.error) return void toast.error(result.error)
    // The member now belongs to another org, so they leave this list.
    setMembers((prev) => prev.filter((m) => m.id !== userId))
    toast.success('Member moved to another organisation')
  }

  async function runRemove() {
    if (!pendingRemove) return
    const result = await removeUserFromOrg(pendingRemove.id)
    if (result.error || !result.data) { const msg = result.error ?? 'Something went wrong'; toast.error(msg); throw new Error(msg) }
    const removed = result.data
    setMembers((prev) => prev.filter((m) => m.id !== removed.id))
    // They're now unassigned, so they become eligible for "Add existing".
    setUnassignedUsers((prev) => [...prev, removed])
    toast.success(`${pendingRemove.name} removed from this organisation`)
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

  async function handleInvite() {
    if (!email.trim() || !fullName.trim()) return
    setInviting(true)
    const result = await inviteUserToOrg(email.trim(), fullName.trim(), role, organisationId)
    setInviting(false)
    if (result.error) return void toast.error(result.error)
    const created = result.data
    if (created) setMembers((prev) => [...prev, created])
    toast.success(`Invite sent to ${email}`)
    setInviteOpen(false)
    setEmail('')
    setFullName('')
    setRole('crew')
  }

  async function handleAddExisting() {
    if (!selectedUserId) return
    setAdding(true)
    const result = await assignUserToOrg(selectedUserId, organisationId)
    setAdding(false)
    if (result.error || !result.data) return void toast.error(result.error ?? 'Something went wrong')
    const added = result.data
    setMembers((prev) => [...prev, added])
    setUnassignedUsers((prev) => prev.filter((u) => u.id !== added.id))
    toast.success(`${added.full_name} added to this organisation`)
    setAddOpen(false)
    setSelectedUserId('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Members ({members.length}) · {adminCount} admin{adminCount !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInviteOpen(true)}
            className="gap-1.5 min-h-[36px] text-xs"
          >
            <Plus size={14} />
            Invite
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="gap-1.5 min-h-[36px] text-xs"
          >
            <UserPlus size={14} />
            Add existing
          </Button>
        </div>
      </div>

      <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
        {members.map((u) => {
          const config = ROLE_CONFIG[u.role]
          const isSelf = u.id === currentUserId
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
                  <span className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                    {config.icon}
                    {config.label}
                  </span>
                </div>
              </div>

              {!isSelf && (
                <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0 flex-wrap">
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

                  {otherOrgs.length > 0 && (
                    <Select
                      value={organisationId}
                      onValueChange={(val) => {
                        if (val && val !== organisationId) moveToOrg(u.id, val)
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-[8rem] h-9 text-xs">
                        <span className="flex-1 text-left truncate text-muted-foreground">Move to…</span>
                      </SelectTrigger>
                      <SelectContent>
                        {otherOrgs.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingRemove({ id: u.id, name: u.full_name })}
                    disabled={disabled}
                    className="gap-1.5 h-9 text-xs"
                  >
                    <UserMinus size={14} />
                    Remove
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingSignIn({ id: u.id, name: u.full_name })}
                    className="gap-1.5 h-9 text-xs"
                  >
                    <Eye size={14} />
                    Sign in as
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Users size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No members yet</p>
              <p className="text-xs text-muted-foreground">Invite the first staff member to this organisation.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">Invite member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="invite-name" className="text-sm font-medium">Full name</Label>
              <Input
                id="invite-name"
                placeholder="Ana Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="ana@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as 'admin' | 'crew')}>
                <SelectTrigger className="h-10">
                  <span className="flex-1 text-left">{ROLE_CONFIG[role].label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setInviteOpen(false)} className="flex-1 h-11">
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || !fullName.trim() || inviting}
                className="flex-1 h-11"
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">Add existing user</DialogTitle>
          </DialogHeader>
          {unassignedUsers.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Users size={22} />
              </div>
              <p className="text-sm text-muted-foreground px-4">
                No unassigned users available. Invite a new member instead.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label className="text-sm font-medium">User</Label>
                <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val ?? '')}>
                  <SelectTrigger className="h-10">
                    <span className="flex-1 text-left truncate">
                      {selectedUserId
                        ? unassignedUsers.find((u) => u.id === selectedUserId)?.full_name
                        : 'Select a user…'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} · {ROLE_CONFIG[u.role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only users not assigned to any organisation are shown. They keep their current role.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11">
                  Cancel
                </Button>
                <Button onClick={handleAddExisting} disabled={!selectedUserId || adding} className="flex-1 h-11">
                  {adding ? 'Adding…' : 'Add to org'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingRemove}
        onOpenChange={(o) => !o && setPendingRemove(null)}
        tone="destructive"
        title="Remove from organisation?"
        description={
          pendingRemove && (
            <>
              <span className="font-medium text-foreground">{pendingRemove.name}</span> will be left
              unassigned and lose access to this organisation. Their account is not deleted.
            </>
          )
        }
        confirmLabel="Remove"
        loadingLabel="Removing…"
        icon={<UserMinus size={18} />}
        onConfirm={runRemove}
      />

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

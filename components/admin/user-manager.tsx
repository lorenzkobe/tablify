'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteUser, updateUserRole, deleteUser } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import { Plus, Trash2, ShieldCheck, Utensils, Users } from 'lucide-react'
import { Initials } from '@/components/shared/initials'
import { cn } from '@/lib/utils'
import type { Profile, Role } from '@/lib/database.types'

export const ROLE_CONFIG: Record<Role, { label: string; description: string; color: string; avatarRing: string; icon: React.ReactNode }> = {
  admin: { label: 'Admin', description: 'Full access · handles cash & closes bills', color: 'text-primary bg-primary/10',       avatarRing: 'ring-primary/30',    icon: <ShieldCheck size={13} /> },
  crew:  { label: 'Crew',  description: 'Take orders & work the queue',              color: 'text-indigo-500 bg-indigo-500/10', avatarRing: 'ring-indigo-500/30', icon: <Utensils size={13} /> },
}

export function UserManager({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('crew')
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [pendingRole, setPendingRole] = useState<{ id: string; name: string; role: Role } | null>(null)

  async function handleInvite() {
    if (!email.trim() || !fullName.trim()) return
    setLoading(true)
    const result = await inviteUser(email.trim(), fullName.trim(), role)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Invite sent to ${email}`)
      setInviteOpen(false)
      setEmail('')
      setFullName('')
      setRole('crew')
      router.refresh()
    }
  }

  async function runRoleChange() {
    if (!pendingRole) return
    const result = await updateUserRole(pendingRole.id, pendingRole.role)
    if (result.error) { toast.error(result.error); throw new Error(result.error) }
    toast.success('Role updated')
    router.refresh()
  }

  async function runDelete() {
    if (!pendingDelete) return
    const result = await deleteUser(pendingDelete.id)
    if (result.error) { toast.error(result.error); throw new Error(result.error) }
    toast.success(`${pendingDelete.name} removed`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Team members
        </p>
        <Button
          size="sm"
          onClick={() => setInviteOpen(true)}
          className="gap-1.5 min-h-[36px] text-xs"
        >
          <Plus size={14} />
          Invite Staff
        </Button>
      </div>

      {/* Staff list */}
      <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
        {users.map((user) => {
          const config = ROLE_CONFIG[user.role]
          const isCurrentUser = user.id === currentUserId
          return (
            <div
              key={user.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/20 transition-colors"
            >
              {/* Avatar + identity */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Initials name={user.full_name} className={cn('w-10 h-10 ring-2', config.avatarRing)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm leading-snug truncate">{user.full_name}</p>
                    {isCurrentUser && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                        You
                      </span>
                    )}
                  </div>
                  <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                    {config.icon}
                    {config.label}
                  </div>
                </div>
              </div>

              {/* Controls */}
              {!isCurrentUser && (
                <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0">
                  <Select
                    value={user.role}
                    onValueChange={(val) =>
                      val !== user.role &&
                      setPendingRole({ id: user.id, name: user.full_name, role: val as Role })
                    }
                  >
                    <SelectTrigger className="w-[7.5rem] h-9 text-xs">
                      <span className="flex-1 text-left truncate">{ROLE_CONFIG[user.role]?.label ?? user.role}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="crew">Crew</SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => setPendingDelete({ id: user.id, name: user.full_name })}
                    aria-label={`Remove ${user.full_name}`}
                    className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
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
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No team members yet</p>
              <p className="text-xs text-muted-foreground">Invite your first staff member to get started.</p>
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="mt-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors min-h-[44px] px-4 flex items-center"
            >
              Invite a team member
            </button>
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">Invite Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div className="space-y-2">
              <Label htmlFor="invite-name" className="text-sm font-medium">Full name</Label>
              <Input
                id="invite-name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="jane@venue.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as Role)}>
                <SelectTrigger className="w-full h-10">
                  <span className="flex-1 text-left text-sm">{ROLE_CONFIG[role]?.label ?? role}</span>
                </SelectTrigger>
                <SelectContent align="start">
                  {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} description={cfg.description}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setInviteOpen(false)}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || !fullName.trim() || loading}
                className="flex-1 h-11"
              >
                {loading ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role change confirmation */}
      <ConfirmDialog
        open={!!pendingRole}
        onOpenChange={(o) => !o && setPendingRole(null)}
        tone="warning"
        title="Change role?"
        description={
          pendingRole && (
            <>
              Change <span className="font-medium text-foreground">{pendingRole.name}</span> to{' '}
              <span className="font-medium text-foreground">{ROLE_CONFIG[pendingRole.role]?.label}</span>?
              This updates what they can access immediately.
            </>
          )
        }
        confirmLabel="Change role"
        loadingLabel="Updating…"
        icon={<ShieldCheck size={18} />}
        onConfirm={runRoleChange}
      />

      {/* Remove member confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Remove member?"
        description={
          pendingDelete && (
            <>
              Remove <span className="font-medium text-foreground">{pendingDelete.name}</span> from the team?
              They will lose access immediately. This cannot be undone.
            </>
          )
        }
        confirmLabel="Remove"
        loadingLabel="Removing…"
        icon={<Trash2 size={18} />}
        onConfirm={runDelete}
      />
    </div>
  )
}

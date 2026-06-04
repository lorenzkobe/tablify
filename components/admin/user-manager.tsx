'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteUser, updateUserRole, deleteUser } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, ShieldCheck, Utensils, ChefHat } from 'lucide-react'
import type { Profile, Role } from '@/lib/database.types'

const ROLE_CONFIG: Record<Role, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  admin:   { label: 'Admin',   description: 'Full access',         color: 'text-primary bg-primary/10',         icon: <ShieldCheck size={13} /> },
  server:  { label: 'Server',  description: 'Take & manage orders', color: 'text-indigo-500 bg-indigo-500/10',   icon: <Utensils size={13} /> },
  kitchen: { label: 'Kitchen', description: 'View & fulfill orders', color: 'text-orange-500 bg-orange-500/10',   icon: <ChefHat size={13} /> },
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0]?.slice(0, 2) ?? '??'
  return (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground uppercase shrink-0">
      {initials}
    </div>
  )
}

export function UserManager({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('server')
  const [loading, setLoading] = useState(false)

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
      setRole('server')
      router.refresh()
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    const result = await updateUserRole(userId, newRole)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Role updated')
      router.refresh()
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return
    const result = await deleteUser(userId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${name} removed`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex justify-end">
        <Button
          onClick={() => setInviteOpen(true)}
          className="gap-2 min-h-[40px]"
        >
          <Plus size={15} />
          Invite Staff
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {users.map((user) => {
          const config = ROLE_CONFIG[user.role]
          const isCurrentUser = user.id === currentUserId
          return (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
              <Initials name={user.full_name} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{user.full_name}</p>
                  {isCurrentUser && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">You</span>
                  )}
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${config.color} w-fit px-1.5 py-0.5 rounded`}>
                  {config.icon}
                  {config.label}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isCurrentUser && (
                  <Select
                    value={user.role}
                    onValueChange={(val) => handleRoleChange(user.id, val as Role)}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <span className="flex-1 text-left truncate">{ROLE_CONFIG[user.role]?.label ?? user.role}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {!isCurrentUser && (
                  <button
                    onClick={() => handleDelete(user.id, user.full_name)}
                    className="p-2 rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {users.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No staff yet.</p>
            <button
              onClick={() => setInviteOpen(true)}
              className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Invite your first team member
            </button>
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="jane@venue.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as Role)}>
                <SelectTrigger className="w-full">
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
              <Button variant="outline" onClick={() => setInviteOpen(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || !fullName.trim() || loading}
                className="flex-1"
              >
                {loading ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

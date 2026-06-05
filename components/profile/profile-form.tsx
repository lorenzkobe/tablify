'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Initials } from '@/components/shared/initials'
import { ROLE_CONFIG } from '@/components/admin/user-manager'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/database.types'

export function ProfileForm({
  fullName: initialName,
  role,
  email,
}: {
  fullName: string
  role: Role
  email: string
}) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const roleConfig = ROLE_CONFIG[role]
  const changingPassword = Boolean(currentPassword || newPassword || confirmPassword)
  const nameChanged = fullName.trim() !== initialName.trim()

  async function handleSave() {
    const name = fullName.trim()
    if (!name) {
      toast.error('Name cannot be empty')
      return
    }

    if (changingPassword) {
      if (!currentPassword) {
        toast.error('Enter your current password')
        return
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match')
        return
      }
    }

    if (!nameChanged && !changingPassword) {
      toast.info('Nothing to update')
      return
    }

    setLoading(true)
    const result = await updateProfile({
      fullName: name,
      currentPassword: changingPassword ? currentPassword : undefined,
      newPassword: changingPassword ? newPassword : undefined,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Profile updated')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    router.refresh()
  }

  return (
    <div className="surface-raised rounded-xl border border-border bg-card p-5 sm:p-6 space-y-6">
      {/* Identity header */}
      <div className="flex items-center gap-4">
        <Initials name={fullName || initialName} className={cn('w-14 h-14 text-base ring-2', roleConfig.avatarRing)} />
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground truncate">{email}</p>
          <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleConfig.color}`}>
            {roleConfig.icon}
            {roleConfig.label}
          </div>
          <p className="text-xs text-muted-foreground">Only an admin can change your role.</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Profile details */}
      <div className="space-y-2">
        <Label htmlFor="full-name" className="text-sm font-medium">Full name</Label>
        <Input
          id="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
        <Input id="email" value={email} disabled className="h-11" />
        <p className="text-xs text-muted-foreground">Email is managed by an admin and cannot be changed here.</p>
      </div>

      <div className="h-px bg-border" />

      {/* Password */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Change password</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Leave blank to keep your current password.</p>

        <div className="space-y-2">
          <Label htmlFor="current-password" className="text-sm font-medium">Current password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-sm font-medium">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSave}
          disabled={loading || (!nameChanged && !changingPassword)}
          className="h-11 px-6"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

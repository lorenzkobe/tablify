import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'
import { UserCircle } from 'lucide-react'
import type { Role } from '@/lib/database.types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name ?? ''
  const role = (profile?.role ?? 'crew') as Role

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <UserCircle size={17} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your account details
          </p>
        </div>
      </div>

      <ProfileForm fullName={fullName} role={role} email={user.email ?? ''} />
    </div>
  )
}

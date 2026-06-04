import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MenuManager } from '@/components/menu/menu-manager'
import { UtensilsCrossed } from 'lucide-react'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [categoriesRes, itemsRes] = await Promise.all([
    supabase.from('menu_categories').select('*').order('sort'),
    supabase.from('menu_items').select('*').order('sort'),
  ])

  const totalItems = itemsRes.data?.length ?? 0
  const availableItems = itemsRes.data?.filter((i) => i.available).length ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <UtensilsCrossed size={17} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Menu</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {availableItems} of {totalItems} item{totalItems !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </div>

      <MenuManager
        categories={categoriesRes.data ?? []}
        items={itemsRes.data ?? []}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MenuManager } from '@/components/menu/menu-manager'
import { PageHeader } from '@/components/shared/page-header'

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
  const unavailableItems = totalItems - availableItems

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Menu"
        description={
          <span className="inline-flex items-center gap-3">
            <span>
              <span className="font-medium text-foreground tabular-nums">{availableItems}</span>
              {' '}of{' '}
              <span className="tabular-nums">{totalItems}</span>{' '}
              item{totalItems !== 1 ? 's' : ''} available
            </span>
            {unavailableItems > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                {unavailableItems} unavailable
              </span>
            )}
          </span>
        }
      />

      <MenuManager
        categories={categoriesRes.data ?? []}
        items={itemsRes.data ?? []}
      />
    </div>
  )
}

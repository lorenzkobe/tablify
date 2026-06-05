'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Keeps an open tab's detail view live: when another device places a round or
// the kitchen advances an item, refresh the server component so its totals and
// activity log recompute. order_items carries no tab_id, so we subscribe to all
// of them (like the queue) and let the scoped server query do the filtering.
export function TabRealtime({ tabId }: { tabId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null

    // Coalesce the burst of events from a multi-item round into one refresh.
    const refresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => router.refresh(), 250)
    }

    const channel = supabase
      .channel(`tab-${tabId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tab_id=eq.${tabId}` },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tabs', filter: `id=eq.${tabId}` },
        refresh,
      )
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [tabId, router])

  return null
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderItemStatus } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { OrderItemStatus } from '@/lib/database.types'

const NEXT_STATUS: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  ordered:     'in_progress',
  in_progress: 'ready',
  ready:       'served',
}

const NEXT_LABEL: Partial<Record<OrderItemStatus, string>> = {
  ordered:     'Start',
  in_progress: 'Mark Ready',
  ready:       'Mark Served',
}

export function UpdateItemStatusButton({
  itemId,
  currentStatus,
}: {
  itemId: string
  currentStatus: OrderItemStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const nextStatus = NEXT_STATUS[currentStatus]
  const nextLabel = NEXT_LABEL[currentStatus]

  if (!nextStatus) return null

  async function handleAdvance() {
    if (!nextStatus) return
    setLoading(true)
    const result = await updateOrderItemStatus(itemId, nextStatus)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAdvance}
      disabled={loading}
      className="h-7 text-xs mt-1"
    >
      {loading ? '…' : nextLabel}
    </Button>
  )
}

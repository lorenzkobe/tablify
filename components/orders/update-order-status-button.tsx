'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { OrderStatus } from '@/lib/database.types'

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:     'in_progress',
  in_progress: 'ready',
  ready:       'served',
  served:      'paid',
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:     'Mark In Progress',
  in_progress: 'Mark Ready',
  ready:       'Mark Served',
  served:      'Mark Paid',
}

export function UpdateOrderStatusButton({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const nextStatus = NEXT_STATUS[currentStatus]
  const nextLabel = NEXT_LABEL[currentStatus]

  async function handleCancel() {
    setLoading(true)
    const result = await updateOrderStatus(orderId, 'cancelled')
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Order cancelled')
      router.refresh()
    }
  }

  async function handleAdvance() {
    if (!nextStatus) return
    setLoading(true)
    const result = await updateOrderStatus(orderId, nextStatus)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Order marked ${nextStatus.replace('_', ' ')}`)
      router.refresh()
    }
  }

  if (currentStatus === 'paid' || currentStatus === 'cancelled') {
    return null
  }

  return (
    <div className="flex gap-2">
      {nextStatus && (
        <Button onClick={handleAdvance} disabled={loading} className="min-h-[44px]">
          {nextLabel}
        </Button>
      )}
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={loading}
        className="min-h-[44px] text-destructive hover:text-destructive"
      >
        Cancel Order
      </Button>
    </div>
  )
}

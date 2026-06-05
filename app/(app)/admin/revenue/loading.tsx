import { Skeleton } from '@/components/ui/skeleton'
import { RevenueDataSkeleton } from '@/components/revenue/revenue-skeleton'

export default function RevenueLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Range controls */}
      <div className="flex flex-wrap items-end gap-3">
        <Skeleton className="h-10 w-[11rem]" />
      </div>

      <RevenueDataSkeleton />
    </div>
  )
}

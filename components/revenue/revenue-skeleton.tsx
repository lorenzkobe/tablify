import { Skeleton } from '@/components/ui/skeleton'

// Skeleton for everything below the range controls (stat cards + charts + tables).
// Shared by the route-level loading.tsx and the in-page <Suspense> fallback so the
// loader appears on every range change, not just the first load.
export function RevenueDataSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-raised rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-1.5 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Revenue-over-time + peak hours */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="surface-raised rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[240px] w-full" />
        </div>
      ))}

      {/* Demand + category share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="surface-raised rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[240px] w-full" />
          </div>
        ))}
      </div>

      {/* Item stats + top categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

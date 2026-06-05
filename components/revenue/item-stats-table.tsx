'use client'

import { useState } from 'react'
import type { RevenueRank } from '@/lib/revenue'
import { formatCurrency } from '@/lib/format'

type SortKey = 'units' | 'revenue'

export function ItemStatsTable({
  items,
  total,
  currency,
}: {
  items: RevenueRank[]
  total: number
  currency: string
}) {
  const [sort, setSort] = useState<SortKey>('revenue')

  const rows = [...items].sort((a, b) =>
    sort === 'units' ? b.quantity - a.quantity : b.revenue - a.revenue,
  )

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Top items
      </h2>
      <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
        <div className="flex items-stretch gap-3 bg-card px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="flex min-h-[44px] min-w-0 flex-1 items-center">Item</span>
          <SortHeader
            label="Units"
            active={sort === 'units'}
            onClick={() => setSort('units')}
          />
          <SortHeader
            label="Revenue"
            active={sort === 'revenue'}
            onClick={() => setSort('revenue')}
            className="w-24"
          />
          <span className="flex min-h-[44px] w-16 items-center justify-end tabular-nums">
            Share
          </span>
        </div>
        {rows.map((r) => {
          const share = total > 0 ? (r.revenue / total) * 100 : 0
          return (
            <div key={r.name} className="flex items-center gap-3 bg-card px-4 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="w-20 shrink-0 text-right tabular-nums">{r.quantity}</span>
              <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                {formatCurrency(r.revenue, currency)}
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                {Math.round(share)}%
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SortHeader({
  label,
  active,
  onClick,
  className,
}: {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[44px] shrink-0 items-center justify-end gap-1 tabular-nums transition-colors ${
        active ? 'font-semibold text-primary' : 'hover:text-foreground'
      } ${className ?? 'w-20'}`}
    >
      {label}
      <span aria-hidden className={active ? 'opacity-100' : 'opacity-0'}>
        ▼
      </span>
    </button>
  )
}

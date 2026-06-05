'use client'

import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/format'
import type { RevenueRank } from '@/lib/revenue'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function CategoryShareChart({
  data,
  currency,
}: {
  data: RevenueRank[]
  currency: string
}) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.revenue, 0), [data])

  const { chartData, config } = useMemo(() => {
    const cfg: ChartConfig = {}
    const rows = data.map((d, i) => {
      const color = PALETTE[i % PALETTE.length]
      cfg[d.name] = { label: d.name, color }
      return { name: d.name, revenue: d.revenue, fill: color }
    })
    return { chartData: rows, config: cfg }
  }, [data])

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Category share
      </h2>
      <div className="surface-raised rounded-xl border border-border bg-card p-4">
        <ChartContainer config={config} className="h-[280px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="name"
                  formatter={(value, name) => {
                    const revenue = Number(value)
                    const share = total > 0 ? (revenue / total) * 100 : 0
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {config[name as keyof typeof config]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatCurrency(revenue, currency)} · {share.toFixed(1)}%
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="revenue"
              nameKey="name"
              innerRadius={56}
              outerRadius={92}
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </div>
    </section>
  )
}

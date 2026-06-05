'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { RevenueRank } from '@/lib/revenue'

const config = {
  units: { label: 'Units sold', color: 'var(--primary)' },
} satisfies ChartConfig

export function ItemDemandChart({ items }: { items: RevenueRank[] }) {
  const data = [...items]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((i) => ({ name: i.name, units: i.quantity }))

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Item demand
      </h2>
      <div className="surface-raised rounded-xl border border-border bg-card p-4">
        <ChartContainer config={config} className="h-[320px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              dataKey="units"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={120}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {Number(value).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="units" fill="var(--color-units)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  )
}

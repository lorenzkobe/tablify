'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/format'

const config = {
  revenue: { label: 'Revenue', color: 'var(--primary)' },
  billCount: { label: 'Bills', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function RevenueTrendChart({
  data,
  currency,
}: {
  data: Array<{ day: string; revenue: number; billCount: number }>
  currency: string
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Revenue trend
      </h2>
      <div className="surface-raised rounded-xl border border-border bg-card p-4">
        <ChartContainer config={config} className="h-[240px] w-full">
          <LineChart data={data} margin={{ left: 4, right: 8, top: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDay}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCurrency(value, currency)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    typeof label === 'string' ? formatDay(label) : label
                  }
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {name === 'revenue'
                          ? formatCurrency(Number(value), currency)
                          : Number(value).toLocaleString()}
                        {name === 'revenue' && item?.payload
                          ? ` · ${Number((item.payload as { billCount?: number }).billCount ?? 0).toLocaleString()} bills`
                          : ''}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-revenue)', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </section>
  )
}

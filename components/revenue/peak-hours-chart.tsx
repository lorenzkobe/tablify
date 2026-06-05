'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/format'

const config = {
  revenue: { label: 'Revenue', color: 'var(--primary)' },
  quantity: { label: 'Units', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12} ${period}`
}

export function PeakHoursChart({
  data,
  currency,
}: {
  data: Array<{ hour: number; revenue: number; quantity: number }>
  currency: string
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Peak hours
      </h2>
      <div className="surface-raised rounded-xl border border-border bg-card p-4">
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) => formatHour(value)}
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
                    typeof label === 'number' ? formatHour(label) : label
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
                          ? ` · ${Number((item.payload as { quantity?: number }).quantity ?? 0).toLocaleString()} units`
                          : ''}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  )
}

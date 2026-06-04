'use client'

import { Clock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TimeSelectProps {
  id?: string
  /** Stored 24-hour "HH:MM" value. */
  value: string
  onChange: (value: string) => void
  /** Minutes between options. */
  step?: number
  /** Optional pill, e.g. "+1 day" when close rolls past midnight. */
  badge?: string
  className?: string
}

// Build "HH:MM" options across the day at `step` minutes, always including the
// current value so an off-grid stored time still appears (and stays selected).
function buildOptions(step: number, include: string): string[] {
  const opts: string[] = []
  for (let m = 0; m < 24 * 60; m += step) {
    const h = Math.floor(m / 60)
    const min = m % 60
    opts.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  if (include && !opts.includes(include)) {
    opts.push(include)
    opts.sort()
  }
  return opts
}

// On-brand, fully themeable time picker. Replaces the native <input type="time">
// (whose popup the browser controls and can't be styled) with our Select
// dropdown, and renders every time in 12-hour format while storing 24h "HH:MM".
export function TimeSelect({ id, value, onChange, step = 15, badge, className }: TimeSelectProps) {
  const options = buildOptions(step, value)

  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger id={id} className={cn('h-11 w-full', className)}>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Clock size={15} className="shrink-0 text-muted-foreground" />
          <SelectValue placeholder="--:--">
            {(val) => (val ? formatClock(val as string) : '--:--')}
          </SelectValue>
        </span>
        {badge && (
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-primary ring-1 ring-inset ring-primary/20">
            {badge}
          </span>
        )}
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="tabular-nums">
            {formatClock(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

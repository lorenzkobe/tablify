'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { addDays } from '@/lib/business-day'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { RevenueDataSkeleton } from '@/components/revenue/revenue-skeleton'

type Preset = 'today' | 'yesterday' | 'last7' | 'month' | 'custom'

const PRESET_LABELS: Record<Preset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  month: 'This month',
  custom: 'Custom range',
}

function presetRange(preset: Exclude<Preset, 'custom'>, today: string): { from: string; to: string } {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday': {
      const d = addDays(today, -1)
      return { from: d, to: d }
    }
    case 'last7':
      return { from: addDays(today, -6), to: today }
    case 'month':
      return { from: `${today.slice(0, 7)}-01`, to: today }
  }
}

function detectPreset(from: string, to: string, today: string): Preset {
  for (const p of ['today', 'yesterday', 'last7', 'month'] as const) {
    const r = presetRange(p, today)
    if (r.from === from && r.to === to) return p
  }
  return 'custom'
}

export function RevenueManager({
  today,
  from,
  to,
  children,
}: {
  today: string
  from: string
  to: string
  children: ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<Preset>(detectPreset(from, to, today))
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  function go(f: string, t: string) {
    if (f === from && t === to) return
    startTransition(() => {
      router.push(`/admin/revenue?from=${f}&to=${t}`)
    })
  }

  function onPreset(value: string | null) {
    if (!value) return
    setMode(value as Preset)
    if (value === 'custom') return
    const r = presetRange(value as Exclude<Preset, 'custom'>, today)
    go(r.from, r.to)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-flow-col auto-cols-max grid-rows-[auto_auto] items-end gap-x-3 gap-y-2">
        <label className="text-xs font-medium text-muted-foreground">Range</label>
      <Select value={mode} onValueChange={onPreset}>
        <SelectTrigger style={{ height: '2.5rem' }} className="w-[11rem] text-sm">
          <span className="min-w-0 flex-1 truncate text-left">{PRESET_LABELS[mode]}</span>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
            <SelectItem key={p} value={p}>{PRESET_LABELS[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {mode === 'custom' && (
        <>
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="date"
            value={customFrom}
            max={customTo || today}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={{ height: '2.5rem' }}
            className="w-[9.5rem]"
          />
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{ height: '2.5rem' }}
            className="w-[9.5rem]"
          />
          <span aria-hidden="true" />
          <Button
            onClick={() => customFrom && customTo && go(customFrom, customTo)}
            disabled={!customFrom || !customTo || customTo < customFrom}
            style={{ height: '2.5rem' }}
          >
            Apply
          </Button>
        </>
      )}
      </div>

      {isPending ? <RevenueDataSkeleton /> : children}
    </div>
  )
}

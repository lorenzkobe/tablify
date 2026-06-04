'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays } from '@/lib/business-day'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

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

export function RevenueManager({ today, from, to }: { today: string; from: string; to: string }) {
  const router = useRouter()
  const active = detectPreset(from, to, today)
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  function go(f: string, t: string) {
    router.push(`/admin/revenue?from=${f}&to=${t}`)
  }

  function onPreset(value: string | null) {
    if (!value || value === 'custom') return
    const r = presetRange(value as Exclude<Preset, 'custom'>, today)
    go(r.from, r.to)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Range</label>
        <Select value={active} onValueChange={onPreset}>
          <SelectTrigger className="w-[10rem] h-10 text-sm">
            <span className="flex-1 text-left">{PRESET_LABELS[active]}</span>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
              <SelectItem key={p} value={p}>{PRESET_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {active === 'custom' && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={customFrom}
              max={customTo || today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-10 w-[9.5rem]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-10 w-[9.5rem]"
            />
          </div>
          <Button
            onClick={() => customFrom && customTo && go(customFrom, customTo)}
            disabled={!customFrom || !customTo || customTo < customFrom}
            className="h-10"
          >
            Apply
          </Button>
        </>
      )}
    </div>
  )
}

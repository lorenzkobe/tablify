'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// The "night crosses midnight" toggle, shared by the create dialog and the
// admin settings form. Defaults are derived from the open/close times by the
// caller, but the user can override (e.g. a venue that genuinely closes the
// same calendar day, or a 24h operation).
export function NextDayToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="space-y-0.5">
        <Label htmlFor="closes-next-day" className="text-sm font-medium">
          Closes next day
        </Label>
        <p className="text-xs text-muted-foreground">
          {checked ? 'Closing time falls on the following day (+1 day)' : 'Opens and closes on the same day'}
        </p>
      </div>
      <Switch id="closes-next-day" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

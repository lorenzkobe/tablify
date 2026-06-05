'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMyOrganisation } from '@/app/actions/organisation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TimeSelect } from '@/components/shared/time-select'
import { CurrencySelect } from '@/components/shared/currency-select'
import { NextDayToggle } from '@/components/shared/next-day-toggle'
import { toast } from 'sonner'
import { closesNextDay, isInvalidSameDayClose } from '@/lib/format'
import type { Organisation } from '@/lib/database.types'

function toTimeInput(t: string): string {
  return t.slice(0, 5)
}

export function OrgSettingsForm({ organisation }: { organisation: Organisation }) {
  const router = useRouter()
  const [name, setName] = useState(organisation.name)
  const [timezone, setTimezone] = useState(organisation.timezone)
  const [openTime, setOpenTimeState] = useState(toTimeInput(organisation.open_time))
  const [closeTime, setCloseTimeState] = useState(toTimeInput(organisation.close_time))
  const [closesNextDayValue, setClosesNextDayValue] = useState(organisation.closes_next_day)
  const [currency, setCurrency] = useState(organisation.currency)
  const [nextDayTouched, setNextDayTouched] = useState(
    organisation.closes_next_day !== closesNextDay(organisation.open_time, organisation.close_time),
  )
  const [loading, setLoading] = useState(false)

  function setOpenTime(value: string) {
    setOpenTimeState(value)
    if (!nextDayTouched) setClosesNextDayValue(closesNextDay(value, closeTime))
  }
  function setCloseTime(value: string) {
    setCloseTimeState(value)
    if (!nextDayTouched) setClosesNextDayValue(closesNextDay(openTime, value))
  }
  function setClosesNextDay(value: boolean) {
    setNextDayTouched(true)
    setClosesNextDayValue(value)
  }

  const invalidClose = isInvalidSameDayClose(openTime, closeTime, closesNextDayValue)

  async function handleSave() {
    if (!name.trim() || invalidClose) return
    setLoading(true)
    const result = await updateMyOrganisation({
      name,
      timezone,
      openTime,
      closeTime,
      closesNextDay: closesNextDayValue,
      currency,
    })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Organisation updated')
    router.refresh()
  }

  return (
    <div className="surface-raised rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-sm font-medium">Name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-tz" className="text-sm font-medium">Timezone (IANA)</Label>
        <Input
          id="org-tz"
          placeholder="Asia/Manila"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="org-open" className="text-sm font-medium">Opens</Label>
          <TimeSelect id="org-open" value={openTime} onChange={setOpenTime} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-close" className="text-sm font-medium">Closes</Label>
          <TimeSelect id="org-close" value={closeTime} onChange={setCloseTime} />
        </div>
      </div>
      <NextDayToggle checked={closesNextDayValue} onCheckedChange={setClosesNextDay} />
      {invalidClose && (
        <p className="text-xs text-destructive">
          Closing time is before the opening time. Turn on “Closes next day”, or pick a later closing time.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="org-currency" className="text-sm font-medium">Currency</Label>
        <CurrencySelect id="org-currency" value={currency} onChange={setCurrency} />
      </div>
      <Button onClick={handleSave} disabled={!name.trim() || invalidClose || loading} className="h-11 w-full">
        {loading ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}

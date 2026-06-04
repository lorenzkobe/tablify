'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMyOrganisation } from '@/app/actions/organisation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TimeSelect } from '@/components/shared/time-select'
import { toast } from 'sonner'
import { parseTime } from '@/lib/business-day'
import type { Organisation } from '@/lib/database.types'

function toTimeInput(t: string): string {
  return t.slice(0, 5)
}

function closesNextDay(openTime: string, closeTime: string): boolean {
  return parseTime(closeTime) <= parseTime(openTime)
}

export function OrgSettingsForm({ organisation }: { organisation: Organisation }) {
  const router = useRouter()
  const [name, setName] = useState(organisation.name)
  const [timezone, setTimezone] = useState(organisation.timezone)
  const [openTime, setOpenTime] = useState(toTimeInput(organisation.open_time))
  const [closeTime, setCloseTime] = useState(toTimeInput(organisation.close_time))
  const [currency, setCurrency] = useState(organisation.currency)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    const result = await updateMyOrganisation({ name, timezone, openTime, closeTime, currency })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Organisation updated')
    router.refresh()
  }

  return (
    <div className="surface-raised rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
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
          <TimeSelect
            id="org-close"
            value={closeTime}
            onChange={setCloseTime}
            badge={closesNextDay(openTime, closeTime) ? '+1 day' : undefined}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-currency" className="text-sm font-medium">Currency (ISO)</Label>
        <Input
          id="org-currency"
          placeholder="PHP"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          className="h-10"
        />
      </div>
      <Button onClick={handleSave} disabled={!name.trim() || loading} className="h-11 w-full">
        {loading ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}

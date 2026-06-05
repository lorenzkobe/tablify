'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganisation, updateOrganisation } from '@/app/actions/superadmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TimeSelect } from '@/components/shared/time-select'
import { CurrencySelect } from '@/components/shared/currency-select'
import { NextDayToggle } from '@/components/shared/next-day-toggle'
import { toast } from 'sonner'
import { closesNextDay, isInvalidSameDayClose } from '@/lib/format'
import type { Organisation } from '@/lib/database.types'

interface OrgForm {
  name: string
  timezone: string
  openTime: string
  closeTime: string
  closesNextDay: boolean
  currency: string
}

const BLANK: OrgForm = {
  name: '',
  timezone: 'Asia/Manila',
  openTime: '17:00',
  closeTime: '03:00',
  closesNextDay: true,
  currency: 'PHP',
}

// Normalise a "HH:MM:SS" time from the DB to the "HH:MM" an <input type=time> wants.
function toTimeInput(t: string): string {
  return t.slice(0, 5)
}

function formFor(org: Organisation | null): OrgForm {
  if (!org) return BLANK
  return {
    name: org.name,
    timezone: org.timezone,
    openTime: toTimeInput(org.open_time),
    closeTime: toTimeInput(org.close_time),
    closesNextDay: org.closes_next_day,
    currency: org.currency,
  }
}

export function OrgFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Organisation | null
  // Receives the saved row so a parent list can update without refetching. When
  // omitted (e.g. single-org detail header), the form refreshes the route.
  onSaved?: (org: Organisation) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            {editing ? 'Edit Organisation' : 'New Organisation'}
          </DialogTitle>
        </DialogHeader>
        {/* Mounts fresh on each open (Radix unmounts closed content), so the
            form initialises from `editing` without a sync effect. */}
        {open && <OrgForm editing={editing} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

function OrgForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: Organisation | null
  onClose: () => void
  onSaved?: (org: Organisation) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<OrgForm>(() => formFor(editing))
  // Until the user overrides it, the toggle tracks the value derived from the
  // open/close times so a sensible default follows along as the times change.
  const [nextDayTouched, setNextDayTouched] = useState(
    editing ? editing.closes_next_day !== closesNextDay(editing.open_time, editing.close_time) : false,
  )
  const [loading, setLoading] = useState(false)

  function setOpenTime(openTime: string) {
    setForm((f) => ({
      ...f,
      openTime,
      closesNextDay: nextDayTouched ? f.closesNextDay : closesNextDay(openTime, f.closeTime),
    }))
  }
  function setCloseTime(closeTime: string) {
    setForm((f) => ({
      ...f,
      closeTime,
      closesNextDay: nextDayTouched ? f.closesNextDay : closesNextDay(f.openTime, closeTime),
    }))
  }
  function setClosesNextDay(closesNextDay: boolean) {
    setNextDayTouched(true)
    setForm((f) => ({ ...f, closesNextDay }))
  }

  const invalidClose = isInvalidSameDayClose(form.openTime, form.closeTime, form.closesNextDay)

  async function handleSave() {
    if (!form.name.trim() || invalidClose) return
    setLoading(true)
    const result = editing
      ? await updateOrganisation(editing.id, form)
      : await createOrganisation(form)
    setLoading(false)
    if (result.error || !result.data) {
      toast.error(result.error ?? 'Something went wrong')
      return
    }
    toast.success(editing ? 'Organisation updated' : 'Organisation created')
    onClose()
    if (onSaved) onSaved(result.data)
    else router.refresh()
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-sm font-medium">Name</Label>
        <Input
          id="org-name"
          placeholder="The Anchor Bar"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          autoFocus
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-tz" className="text-sm font-medium">Timezone (IANA)</Label>
        <Input
          id="org-tz"
          placeholder="Asia/Manila"
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="org-open" className="text-sm font-medium">Opens</Label>
          <TimeSelect id="org-open" value={form.openTime} onChange={setOpenTime} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-close" className="text-sm font-medium">Closes</Label>
          <TimeSelect id="org-close" value={form.closeTime} onChange={setCloseTime} />
        </div>
      </div>
      <NextDayToggle checked={form.closesNextDay} onCheckedChange={setClosesNextDay} />
      {invalidClose && (
        <p className="text-xs text-destructive">
          Closing time is before the opening time. Turn on “Closes next day”, or pick a later closing time.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="org-currency" className="text-sm font-medium">Currency</Label>
        <CurrencySelect
          id="org-currency"
          value={form.currency}
          onChange={(currency) => setForm({ ...form, currency })}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1 h-11">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!form.name.trim() || invalidClose || loading}
          className="flex-1 h-11"
        >
          {loading ? 'Saving…' : editing ? 'Save' : 'Create'}
        </Button>
      </div>
    </div>
  )
}

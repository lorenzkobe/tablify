'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganisation, updateOrganisation } from '@/app/actions/superadmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TimeSelect } from '@/components/shared/time-select'
import { toast } from 'sonner'
import { parseTime } from '@/lib/business-day'
import type { Organisation } from '@/lib/database.types'

interface OrgForm {
  name: string
  timezone: string
  openTime: string
  closeTime: string
  currency: string
}

const BLANK: OrgForm = {
  name: '',
  timezone: 'Asia/Manila',
  openTime: '17:00',
  closeTime: '03:00',
  currency: 'PHP',
}

// Normalise a "HH:MM:SS" time from the DB to the "HH:MM" an <input type=time> wants.
function toTimeInput(t: string): string {
  return t.slice(0, 5)
}

// A close time that is at or before the open time rolls into the next calendar day.
export function closesNextDay(openTime: string, closeTime: string): boolean {
  return parseTime(closeTime) <= parseTime(openTime)
}

function formFor(org: Organisation | null): OrgForm {
  if (!org) return BLANK
  return {
    name: org.name,
    timezone: org.timezone,
    openTime: toTimeInput(org.open_time),
    closeTime: toTimeInput(org.close_time),
    currency: org.currency,
  }
}

export function OrgFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Organisation | null
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
        {open && <OrgForm editing={editing} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function OrgForm({ editing, onClose }: { editing: Organisation | null; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState<OrgForm>(() => formFor(editing))
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) return
    setLoading(true)
    const result = editing
      ? await updateOrganisation(editing.id, form)
      : await createOrganisation(form)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(editing ? 'Organisation updated' : 'Organisation created')
    onClose()
    router.refresh()
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
          <TimeSelect
            id="org-open"
            value={form.openTime}
            onChange={(openTime) => setForm({ ...form, openTime })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-close" className="text-sm font-medium">Closes</Label>
          <TimeSelect
            id="org-close"
            value={form.closeTime}
            onChange={(closeTime) => setForm({ ...form, closeTime })}
            badge={closesNextDay(form.openTime, form.closeTime) ? '+1 day' : undefined}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-currency" className="text-sm font-medium">Currency (ISO)</Label>
        <Input
          id="org-currency"
          placeholder="PHP"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
          maxLength={3}
          className="h-10"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1 h-11">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!form.name.trim() || loading}
          className="flex-1 h-11"
        >
          {loading ? 'Saving…' : editing ? 'Save' : 'Create'}
        </Button>
      </div>
    </div>
  )
}

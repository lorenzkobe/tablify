'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganisation, updateOrganisation } from '@/app/actions/superadmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Building2, Pencil, Clock } from 'lucide-react'
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

export function OrganisationManager({ organisations }: { organisations: Organisation[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Organisation | null>(null)
  const [form, setForm] = useState<OrgForm>(BLANK)
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(BLANK)
    setOpen(true)
  }

  function openEdit(org: Organisation) {
    setEditing(org)
    setForm({
      name: org.name,
      timezone: org.timezone,
      openTime: toTimeInput(org.open_time),
      closeTime: toTimeInput(org.close_time),
      currency: org.currency,
    })
    setOpen(true)
  }

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
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Businesses
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 min-h-[36px] text-xs">
          <Plus size={14} />
          New Organisation
        </Button>
      </div>

      <div className="surface-raised rounded-xl border border-border overflow-hidden divide-y divide-border">
        {organisations.map((org) => (
          <div
            key={org.id}
            className="flex items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm leading-snug truncate">{org.name}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} />
                {toTimeInput(org.open_time)}–{toTimeInput(org.close_time)} · {org.timezone} · {org.currency}
              </p>
            </div>
            <button
              onClick={() => openEdit(org)}
              aria-label={`Edit ${org.name}`}
              className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            >
              <Pencil size={15} />
            </button>
          </div>
        ))}

        {organisations.length === 0 && (
          <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Building2 size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No organisations yet</p>
              <p className="text-xs text-muted-foreground">Create the first business to get started.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">
              {editing ? 'Edit Organisation' : 'New Organisation'}
            </DialogTitle>
          </DialogHeader>
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
                <Input
                  id="org-open"
                  type="time"
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-close" className="text-sm font-medium">Closes</Label>
                <Input
                  id="org-close"
                  type="time"
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                  className="h-10"
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
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11">
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

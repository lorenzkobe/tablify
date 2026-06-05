'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OrgFormDialog } from '@/components/superadmin/org-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Building2, Pencil, Clock, ChevronRight } from 'lucide-react'
import { formatClock } from '@/lib/format'
import type { Organisation } from '@/lib/database.types'

export function OrganisationManager({
  organisations: initialOrganisations,
}: {
  organisations: Organisation[]
}) {
  const [organisations, setOrganisations] = useState<Organisation[]>(initialOrganisations)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Organisation | null>(null)

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(org: Organisation) {
    setEditing(org)
    setOpen(true)
  }

  function handleSaved(saved: Organisation) {
    setOrganisations((prev) =>
      prev.some((o) => o.id === saved.id)
        ? prev.map((o) => (o.id === saved.id ? saved : o))
        : [...prev, saved],
    )
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
            <Link
              href={`/superadmin/organisations/${org.slug}`}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm leading-snug truncate">{org.name}</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>
                    {formatClock(org.open_time)} – {formatClock(org.close_time)}
                    {org.closes_next_day && (
                      <span className="ml-1 text-primary/80">+1d</span>
                    )}
                  </span>
                  · {org.timezone} · {org.currency}
                </p>
              </div>
            </Link>
            <button
              onClick={() => openEdit(org)}
              aria-label={`Edit ${org.name}`}
              className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            >
              <Pencil size={15} />
            </button>
            <Link
              href={`/superadmin/organisations/${org.slug}`}
              aria-label={`Open ${org.name}`}
              className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            >
              <ChevronRight size={16} />
            </Link>
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

      <OrgFormDialog open={open} onOpenChange={setOpen} editing={editing} onSaved={handleSaved} />
    </div>
  )
}

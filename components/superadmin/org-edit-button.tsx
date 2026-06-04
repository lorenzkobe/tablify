'use client'

import { useState } from 'react'
import { OrgFormDialog } from '@/components/superadmin/org-form-dialog'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import type { Organisation } from '@/lib/database.types'

export function OrgEditButton({ org }: { org: Organisation }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5 h-9 text-xs">
        <Pencil size={14} />
        Edit
      </Button>
      <OrgFormDialog open={open} onOpenChange={setOpen} editing={org} />
    </>
  )
}

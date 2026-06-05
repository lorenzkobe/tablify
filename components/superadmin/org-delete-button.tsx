'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteOrganisation } from '@/app/actions/superadmin'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function OrgDeleteButton({
  org,
  memberCount,
}: {
  org: { id: string; name: string }
  memberCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function runDelete() {
    const result = await deleteOrganisation(org.id)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success('Organisation deleted')
    router.push('/superadmin/organisations')
    router.refresh()
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 h-9 text-xs text-destructive hover:text-destructive"
      >
        <Trash2 size={14} />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="destructive"
        icon={<Trash2 size={18} />}
        confirmDelaySeconds={5}
        title="Delete organisation?"
        description={
          <>
            <span className="font-medium text-foreground">{org.name}</span> and all of its tabs,
            orders, and menu will be permanently deleted. Its {memberCount} member
            {memberCount === 1 ? '' : 's'} will be unassigned and won&apos;t be able to log in until
            reassigned to an organisation. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={runDelete}
      />
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTab } from '@/app/actions/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export function NewTabDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    const result = await createTab(name.trim())
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Tab "${name}" opened`)
      setOpen(false)
      setName('')
      router.push(`/tabs/${result.tabId}`)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]">
        <Plus size={16} />
        Open Tab
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm gap-0 p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-border">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Receipt size={18} className="text-primary" />
              </div>
              <DialogTitle className="text-base font-semibold tracking-tight">Open a Tab</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-2 ml-12">
              A tab is one running bill. Name it after a table or the customer.
            </DialogDescription>
          </div>

          <div className="px-6 py-5 space-y-2">
            <Label htmlFor="tab-name" className="text-sm font-medium">
              Table or customer name
            </Label>
            <Input
              id="tab-name"
              placeholder="e.g. Table 5, John, Bar Seat 3…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="h-11"
            />
          </div>

          <div className="px-6 pb-6 flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || loading} className="flex-1 min-h-[44px]">
              {loading ? 'Opening…' : 'Open Tab'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

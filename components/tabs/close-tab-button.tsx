'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { closeTab } from '@/app/actions/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

export function CloseTabButton({ tabId, tabName, total }: { tabId: string; tabName: string; total?: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const hasBalance = total != null && total > 0

  async function handleClose() {
    setLoading(true)
    const result = await closeTab(tabId)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Tab closed')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="min-h-[44px]">
        Close Tab
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm gap-0 p-0 overflow-hidden">
          <div className={`px-6 pt-6 pb-5 border-b border-border ${hasBalance ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
            <div className="flex items-center gap-3 mb-1">
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${hasBalance ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-destructive/10'}`}>
                {hasBalance
                  ? <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                  : <X size={18} className="text-destructive" />
                }
              </div>
              <DialogTitle className="text-base font-semibold">
                Close &ldquo;{tabName}&rdquo;?
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-2 ml-12">
              {hasBalance
                ? `Tab has an outstanding balance of $${total!.toFixed(2)}. Collect payment before closing.`
                : 'This will mark the tab as closed. This cannot be undone.'}
            </DialogDescription>
          </div>

          <div className="px-6 pb-6 flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 min-h-[44px]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClose} disabled={loading} className="flex-1 min-h-[44px]">
              {loading ? 'Closing…' : 'Close Tab'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

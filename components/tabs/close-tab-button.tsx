'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { closeTab } from '@/app/actions/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'

export interface BillLine {
  name: string
  quantity: number
  lineTotal: number
}

export function CloseTabButton({
  tabId,
  tabName,
  total,
  lines = [],
}: {
  tabId: string
  tabName: string
  total?: number
  lines?: BillLine[]
}) {
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
    } else if (result.deleted) {
      toast.success('Empty tab deleted')
      setOpen(false)
      router.push('/tabs')
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
          <div className={`px-6 pt-6 pb-5 border-b border-border ${hasBalance ? 'bg-amber-500/5' : ''}`}>
            <div className="flex items-center gap-3 mb-1">
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${hasBalance ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
                {hasBalance
                  ? <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                  : <X size={18} className="text-destructive" />
                }
              </div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                Close &ldquo;{tabName}&rdquo;?
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-2 ml-12">
              {hasBalance
                ? 'Check the bill below, then collect payment before settling.'
                : 'This tab is empty and will be permanently deleted. This cannot be undone.'}
            </DialogDescription>
          </div>

          {hasBalance && (
            <div className="px-6 pt-5 pb-1">
              <div className="surface-raised rounded-lg px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  {tabName}
                </p>
                <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {lines.map((line) => (
                    <li key={line.name} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="tabular-nums text-muted-foreground">{line.quantity}×</span>{' '}
                        <span className="font-medium">{line.name}</span>
                      </span>
                      <span className="tabular-nums shrink-0">{formatCurrency(line.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-border flex items-baseline justify-between">
                  <span className="text-sm font-semibold tracking-tight">Total</span>
                  <span className="text-base font-bold tabular-nums tracking-tight">
                    {formatCurrency(total!)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 pt-5 pb-6 flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 min-h-[44px]">
              Cancel
            </Button>
            <Button variant={hasBalance ? 'default' : 'destructive'} onClick={handleClose} disabled={loading} className="flex-1 min-h-[44px]">
              {loading ? (hasBalance ? 'Settling…' : 'Deleting…') : hasBalance ? 'Close & Settle' : 'Delete Tab'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

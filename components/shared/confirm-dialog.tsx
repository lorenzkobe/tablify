'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConfirmTone = 'destructive' | 'warning'

/**
 * Shared confirmation dialog for destructive or significant actions.
 * `onConfirm` runs with an internal loading state; throw from it to keep the
 * dialog open (e.g. on a failed mutation), or resolve to auto-close.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  loadingLabel = 'Working…',
  cancelLabel = 'Cancel',
  tone = 'destructive',
  icon,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  loadingLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: ReactNode
  onConfirm: () => Promise<void> | void
}) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Parent surfaces the failure (toast); keep the dialog open.
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm gap-0 p-0 overflow-hidden">
        <div className={cn('px-6 pt-6 pb-5 border-b border-border', tone === 'warning' && 'bg-amber-500/5')}>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
                tone === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {icon ?? <AlertTriangle size={18} />}
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground mt-2 ml-12">
              {description}
            </DialogDescription>
          )}
        </div>

        <div className="px-6 pt-5 pb-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 min-h-[44px]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'warning' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 min-h-[44px]"
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

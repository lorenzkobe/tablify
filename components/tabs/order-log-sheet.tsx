'use client'

import { useState } from 'react'
import { MoreVertical, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/format'
import type { OrderItemStatus } from '@/lib/database.types'

// Label for each status an entry transitioned *into*. The origin entry is
// rendered as "Placed" separately (no status_event exists for item creation).
const TO_STATUS_VERB: Record<OrderItemStatus, string> = {
  ordered: 'Re-queued',
  in_progress: 'Started',
  ready: 'Ready',
  served: 'Served',
  returned: 'Returned',
}

export interface OrderLogEntry {
  id: string
  at: string
  itemName: string
  quantity: number
  roundShort: string
  toStatus: OrderItemStatus
  isOrigin: boolean
  actor: string
}

export function OrderLogMenu({ tabName, entries }: { tabName: string; entries: OrderLogEntry[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-lg" aria-label="Tab options" />}
        >
          <MoreVertical size={18} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <ScrollText />
            Order log
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Order log</SheetTitle>
            <SheetDescription>{tabName} — every status change, in order</SheetDescription>
          </SheetHeader>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="relative min-h-0 flex-1 overflow-y-auto pr-1">
              {entries.map((entry, i) => (
                <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < entries.length - 1 && (
                    <span
                      className="absolute left-[5px] top-3 h-full w-px bg-border"
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      'mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ring-popover',
                      entry.isOrigin ? 'bg-primary' : 'bg-muted-foreground/40'
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">
                        {entry.quantity}× {entry.itemName}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatTime(entry.at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.isOrigin ? 'Placed' : TO_STATUS_VERB[entry.toStatus]} · by {entry.actor}
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">
                        Round #{entry.roundShort}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

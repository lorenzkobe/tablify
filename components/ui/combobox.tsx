"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"

import { cn } from "@/lib/utils"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  items: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  disabled,
  id,
  className,
}: ComboboxProps) {
  const selected = items.find((i) => i.value === value) ?? null

  return (
    <ComboboxPrimitive.Root
      items={items}
      value={selected}
      onValueChange={(next) => onValueChange(next?.value ?? "")}
      disabled={disabled}
    >
      <ComboboxPrimitive.Trigger
        id={id}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 h-11 text-sm whitespace-nowrap transition-colors outline-none select-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("flex-1 text-left truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ComboboxPrimitive.Icon
          render={<ChevronsUpDownIcon className="size-4 text-muted-foreground shrink-0" />}
        />
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="start"
          className="isolate z-50"
        >
          <ComboboxPrimitive.Popup
            className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <ComboboxPrimitive.Input
                placeholder={searchPlaceholder}
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ComboboxPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-60 overflow-y-auto p-1">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 pr-9 pl-3 text-sm outline-hidden transition-colors select-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-disabled:pointer-events-none data-disabled:opacity-40"
                >
                  <span className="flex-1 truncate">{item.label}</span>
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2.5 flex size-4 items-center justify-center text-primary">
                    <CheckIcon className="size-3.5" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

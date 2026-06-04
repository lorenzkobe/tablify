'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ISO 4217 code + display name. PHP leads (the default tenant currency),
// followed by the currencies most likely to be needed, then the long tail.
// Picking from a list avoids the typos a free-text ISO field invites.
const COMMON: Array<[string, string]> = [
  ['PHP', 'Philippine Peso'],
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['JPY', 'Japanese Yen'],
  ['AUD', 'Australian Dollar'],
  ['CAD', 'Canadian Dollar'],
  ['SGD', 'Singapore Dollar'],
  ['HKD', 'Hong Kong Dollar'],
]

const OTHERS: Array<[string, string]> = [
  ['AED', 'UAE Dirham'],
  ['CHF', 'Swiss Franc'],
  ['CNY', 'Chinese Yuan'],
  ['IDR', 'Indonesian Rupiah'],
  ['INR', 'Indian Rupee'],
  ['KRW', 'South Korean Won'],
  ['MYR', 'Malaysian Ringgit'],
  ['NZD', 'New Zealand Dollar'],
  ['SAR', 'Saudi Riyal'],
  ['THB', 'Thai Baht'],
  ['TWD', 'New Taiwan Dollar'],
  ['VND', 'Vietnamese Dong'],
  ['ZAR', 'South African Rand'],
]

interface CurrencySelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function CurrencySelect({ id, value, onChange, className }: CurrencySelectProps) {
  // Keep an off-list stored value selectable so existing data never disappears.
  const known = [...COMMON, ...OTHERS].some(([code]) => code === value)

  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger id={id} className={cn('h-10 w-full', className)}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectGroup>
          <SelectLabel>Common</SelectLabel>
          {COMMON.map(([code, name]) => (
            <SelectItem key={code} value={code}>
              <span className="font-medium tabular-nums">{code}</span>
              <span className="ml-2 text-muted-foreground">{name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>More</SelectLabel>
          {OTHERS.map(([code, name]) => (
            <SelectItem key={code} value={code}>
              <span className="font-medium tabular-nums">{code}</span>
              <span className="ml-2 text-muted-foreground">{name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
        {!known && value && (
          <>
            <SelectSeparator />
            <SelectItem value={value}>
              <span className="font-medium tabular-nums">{value}</span>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  )
}

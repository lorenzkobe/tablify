import { cn } from '@/lib/utils'

export function Initials({ name, className }: { name: string; className?: string }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0]?.slice(0, 2) ?? '??'
  return (
    <div
      className={cn(
        'w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground uppercase shrink-0',
        className
      )}
    >
      {initials}
    </div>
  )
}

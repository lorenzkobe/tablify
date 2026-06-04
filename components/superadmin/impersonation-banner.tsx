import { Eye } from 'lucide-react'
import { stopImpersonating } from '@/app/actions/superadmin'

// Shown on every page while a superadmin is impersonating another user.
export function ImpersonationBanner({ name }: { name: string }) {
  return (
    <div className="sticky top-14 md:top-0 z-40 flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 min-w-0 text-primary">
        <Eye size={15} className="shrink-0" />
        <span className="truncate">
          Signed in as <span className="font-semibold">{name || 'user'}</span>
        </span>
      </span>
      <form action={stopImpersonating}>
        <button
          type="submit"
          className="shrink-0 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 min-h-[32px]"
        >
          Stop impersonating
        </button>
      </form>
    </div>
  )
}

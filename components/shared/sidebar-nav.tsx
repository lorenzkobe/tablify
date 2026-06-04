'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Table2,
  Scroll,
  ClipboardList,
  UtensilsCrossed,
  BookOpen,
  Users,
  LogOut,
} from 'lucide-react'
import { TablifyMark, TablifyWordmark } from '@/components/shared/logo'
import { logout } from '@/app/actions/auth'
import type { Role } from '@/lib/database.types'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'server', 'kitchen'] as Role[] },
  { href: '/tables',      label: 'Tables',    icon: Table2,           roles: ['admin', 'server'] as Role[] },
  { href: '/tabs',        label: 'Tabs',      icon: Scroll,           roles: ['admin', 'server'] as Role[] },
  { href: '/orders',      label: 'Orders',    icon: ClipboardList,    roles: ['admin', 'server'] as Role[] },
  { href: '/kitchen',     label: 'Kitchen',   icon: UtensilsCrossed,  roles: ['admin', 'kitchen'] as Role[] },
  { href: '/menu',        label: 'Menu',      icon: BookOpen,         roles: ['admin'] as Role[] },
  { href: '/admin/users', label: 'Users',     icon: Users,            roles: ['admin'] as Role[] },
]

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-border bg-sidebar px-3 py-5 shrink-0">
        <div className="px-2 mb-7">
          <TablifyWordmark />
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[38px]',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-3 border-t border-border">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent min-h-[38px]"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-sidebar border-b border-border">
        <TablifyWordmark />
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </form>
      </header>

      {/* ── Mobile bottom nav ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center bg-sidebar border-t border-border px-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-md transition-colors min-h-[44px]',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

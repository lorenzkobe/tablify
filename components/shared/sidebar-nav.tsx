'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Scroll,
  UtensilsCrossed,
  BookOpen,
  Users,
  BarChart3,
  Building2,
  UserCog,
  Settings,
  LogOut,
} from 'lucide-react'
import { TablifyWordmark } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Initials } from '@/components/shared/initials'
import { logout } from '@/app/actions/auth'
import type { Role } from '@/lib/database.types'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  crew: 'Crew',
}

const NAV_ITEMS = [
  { href: '/dashboard',                label: 'Dashboard',     icon: LayoutDashboard, roles: ['admin', 'crew'] as Role[] },
  { href: '/tabs',                     label: 'Tabs',          icon: Scroll,          roles: ['admin', 'crew'] as Role[] },
  { href: '/queue',                    label: 'Queue',         icon: UtensilsCrossed, roles: ['admin', 'crew'] as Role[] },
  { href: '/menu',                     label: 'Menu',          icon: BookOpen,        roles: ['admin'] as Role[] },
  { href: '/admin/revenue',            label: 'Revenue',       icon: BarChart3,       roles: ['admin'] as Role[] },
  { href: '/admin/users',              label: 'Users',         icon: Users,           roles: ['admin'] as Role[] },
  { href: '/admin/settings',           label: 'Settings',      icon: Settings,        roles: ['admin'] as Role[] },
  { href: '/superadmin/organisations', label: 'Organisations', icon: Building2,       roles: ['superadmin'] as Role[] },
  { href: '/superadmin/users',         label: 'All Users',     icon: UserCog,         roles: ['superadmin'] as Role[] },
]

export function AppNav({ role, fullName }: { role: Role; fullName: string }) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const profileActive = pathname === '/profile'

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 h-screen border-r border-border bg-sidebar px-3 py-5 shrink-0">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[38px]',
                  active
                    ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg px-2 py-2 mb-1 transition-colors min-h-[44px]',
            profileActive
              ? 'bg-primary/10 ring-1 ring-inset ring-primary/20'
              : 'hover:bg-accent'
          )}
        >
          <Initials name={fullName || 'User'} className="w-8 h-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium leading-tight truncate', profileActive ? 'text-primary' : 'text-foreground')}>
              {fullName || 'Your profile'}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">{ROLE_LABELS[role]}</p>
          </div>
        </Link>

        <div className="pt-3 border-t border-border flex items-center gap-1">
          <form action={logout} className="flex-1">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent min-h-[38px]"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
          <ThemeToggle className="w-9 h-9 shrink-0" />
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-sidebar border-b border-border">
        <TablifyWordmark />
        <div className="flex items-center gap-1">
          <Link
            href="/profile"
            aria-label="Your profile"
            className={cn(
              'flex items-center justify-center rounded-full transition-opacity',
              profileActive ? 'ring-2 ring-primary' : 'opacity-90 hover:opacity-100'
            )}
          >
            <Initials name={fullName || 'User'} className="w-8 h-8 text-xs" />
          </Link>
          <ThemeToggle className="w-9 h-9" />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
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
                  ? 'text-primary'
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

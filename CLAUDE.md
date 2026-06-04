@AGENTS.md

# Tablify — Bar & Restaurant Order Management

## Project Overview
Staff-only web app for managing orders per table or open tab, with real-time kitchen display and admin controls. No public access.

**Tagline:** "Every order, in its place."
**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel

## Architecture

### Tech Stack
- **Frontend:** Next.js 15 App Router (server components + client components)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Geist font
- **Database:** Supabase Postgres (Pro plan)
- **Auth:** Supabase Auth — email/password, admin-only invites (no public signup)
- **Real-time:** Supabase Realtime subscriptions (kitchen display, dashboard)
- **Toasts:** `sonner`
- **Deployment:** Vercel (Pro)

### Key Files
```
lib/
  database.types.ts       — Full Supabase Database type + application interfaces
  supabase/
    client.ts             — Browser-side Supabase client (createBrowserClient)
    server.ts             — Server-side client + admin client (service role)
    middleware.ts         — Session refresh + redirect logic
  format.ts               — formatDistanceToNow, formatCurrency, formatTime

app/
  middleware.ts           — Route protection (unauthenticated → /login)
  (auth)/login/           — Login page
  (app)/layout.tsx        — Authenticated shell: fetches profile + role, renders sidebar
  (app)/dashboard/        — Overview: tables, tabs, active orders
  (app)/tables/           — Floor view + table detail with order management
  (app)/tabs/             — Walk-up customer tabs
  (app)/orders/           — Orders list (filterable) + order detail
  (app)/kitchen/          — Real-time Kitchen Display System (KDS)
  (app)/menu/             — Menu management (admin only)
  (app)/admin/users/      — Staff management: invite, assign roles, remove (admin only)
  actions/
    auth.ts               — logout() server action
    orders.ts             — createOrder, updateOrderStatus, updateOrderItemStatus
    tabs.ts               — createTab, closeTab
    menu.ts               — createCategory, updateCategory, deleteCategory, createMenuItem, ...
    admin.ts              — inviteUser, updateUserRole, deleteUser

components/
  shared/
    logo.tsx              — TablifyMark SVG + TablifyWordmark
    status-badge.tsx      — OrderStatusBadge, ItemStatusBadge, TableStatusBadge, TabStatusBadge
    sidebar-nav.tsx       — Role-based sidebar navigation
  orders/
    new-order-button.tsx  — Dialog for creating orders with menu item picker + cart
    update-order-status-button.tsx
    update-item-status-button.tsx
  tabs/
    new-tab-dialog.tsx
    close-tab-button.tsx
  kitchen/
    kitchen-display.tsx   — Real-time KDS component with Supabase subscription
  menu/
    menu-manager.tsx      — Full CRUD for categories and items
  admin/
    user-manager.tsx      — Invite + role management UI

supabase/migrations/
  001_initial_schema.sql  — All tables, enums, triggers, indexes, GRANTs, Realtime
  002_rls_policies.sql    — Row Level Security for all tables
```

## Database Schema

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id, full_name, role | Auto-created on signup via trigger |
| `venue_tables` | id, label, capacity, status | Physical seating |
| `tabs` | id, name, status, opened_by | Walk-up / no-table orders |
| `orders` | id, table_id OR tab_id, taken_by, status | One must be set, not both |
| `menu_categories` | id, name, sort | Category ordering |
| `menu_items` | id, category_id, name, price, available | `available=false` = 86'd |
| `order_items` | id, order_id, menu_item_id, quantity, unit_price, status | Line items |

### Roles
- **admin** — full access: menu, users, all orders, tables
- **server** — take orders, update order status, manage tabs
- **kitchen** — view order_items, update item status

## Branding — "Ink & Signal"

The app uses the **Ink & Signal** design language: true-neutral ink surfaces with a single Electric Cyan signal accent. All colors are token-driven (OKLCH) in `app/globals.css` — never hardcode color values (e.g. `sky-*`, `teal-*`, `$`) in components; reference the semantic tokens instead.

- **Signal accent:** Electric Cyan (`primary` token) — used for active nav, focus rings, the live indicator, and the logo gradient. This is the single brand accent; do not introduce competing accent hues.
- **Surfaces:** True-neutral OKLCH palette. Use `.surface-raised` (inner highlight + soft shadow, no glow) for elevation/hierarchy rather than relying on color.
- **Font:** Geist / Geist Mono (Vercel's font)
- **Dark mode first** (kitchen/bar are dim environments). Light/dark theme toggle is pre-hydration (no flash); see `components/shared/theme-toggle.tsx`.
- **Status palette:** Centralized token maps `ORDER_STATUS_TONE` / `ITEM_STATUS_TONE` in `components/shared/status-badge.tsx`. Tones: pending=amber, in_progress=orange, ready=emerald, served=neutral, paid=cyan, cancelled/returned=rose. Statuses render with the soft-tint pattern (10% bg / 20–30% border / full-opacity text).
- **Shared layout:** Use the `PageHeader` component (`components/shared/page-header.tsx`) for consistent page titles.

### Updating styling or branding
- All color, surface, and depth tokens live in `app/globals.css`. To retune the palette, edit the token values there — every component inherits automatically.
- Use the `currentColor` CSS pattern for per-instance coloring (e.g. the live-dot can glow emerald for kitchen, cyan for dashboard) instead of duplicating CSS.
- After any styling change, run `npm run lint` and `npm run type-check`, and visually inspect in **both** light and dark themes.

## Development Workflow

### Setup
1. Copy `.env.example` → `.env.local` and fill in Supabase credentials
2. `npm install`
3. Run migrations in Supabase Dashboard SQL Editor (or via Supabase CLI)
4. `npm run dev`

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # only needed for admin operations (inviteUserByEmail)
```

### Supabase Setup Notes
- Project was created after May 30 2026 → explicit `GRANT` statements required (already in migration 001)
- Enable Realtime for `orders`, `order_items`, `venue_tables`, `tabs` in Supabase Dashboard if not already enabled by the migration
- Auth → Email → disable "Confirm email" for invite flow to work smoothly
- Auth → URL Configuration → set Site URL to your Vercel domain; add callback URL `https://yourdomain.com/auth/callback`

### Database Types
We hand-write `lib/database.types.ts` with full Relationship definitions (not auto-generated by CLI yet).
After connecting to a real Supabase project, replace with:
```bash
npx supabase gen types typescript --project-id <id> > lib/database.types.ts
```
Then re-export the application interfaces from it.

## Standards & Best Practices

### Code Style
- TypeScript strict mode — no `any`, no suppressed errors
- Server components for data fetching; client components only for interactivity
- Server Actions for all mutations (no API routes needed)
- `revalidatePath()` after every mutation
- No comments unless the WHY is non-obvious

### Security
- All routes protected by middleware (unauthenticated → /login)
- Admin-only pages double-check role server-side (not just nav visibility)
- RLS enforces data access at the DB level regardless of client bugs
- Service role key only used in admin server actions (never exposed to client)

### Testing
- Run `npm run build` to catch TypeScript + Next.js build errors before deploying
- After schema changes, verify RLS: log in as kitchen role, confirm cannot insert orders
- Regression test order flow: login → create table order → kitchen sees it live → advance status → table shows as occupied

### UI
- Minimum 44px tap targets for all interactive elements (tablet/bar use)
- Toast (`sonner`) for all async feedback
- `router.refresh()` after mutations to revalidate server component data

# Cashier role — design

**Date:** 2026-06-06
**Status:** Approved

## Problem

Closing/settling a bill is currently restricted to `admin`. An admin is not always
on the premises, so checkout can be blocked. We need a role that handles checkout
without exposing administrative surfaces (users, organisation, revenue, menu,
settings).

## Concept

Introduce a fourth application role: **`cashier`**.

`cashier` = `crew` + the ability to close/settle tabs.

- Same operational reach as `crew`: Dashboard, Tabs, Queue; take orders; create and
  work tabs; advance order-item status.
- **Plus** the ability to close a tab (settle the bill), which crew cannot do.
- **No** access to Menu, Users, Revenue, Settings, or Organisation management.

Admin keeps every ability it has today, including closing tabs. Crew is unchanged
(still cannot close tabs). Decisions confirmed with the user:

- Who can close tabs after this change: **admin + cashier** (crew still cannot).
- Cashier scope: **exactly crew + close** — no narrowing of crew abilities.

## Changes

### 1. Database

The role lives in the `public.user_role` enum. Migrations 003/004 swapped the enum
via a rename because they *removed/collapsed* values; we are purely *adding* one, so
we use `ALTER TYPE ... ADD VALUE`, which is lower-risk (no need to drop/recreate
every policy). Postgres forbids using a newly added enum value in the same
transaction it is created in, so the work is split across two files that must be run
in order (the Supabase CLI / SQL editor runs each file as its own transaction):

**`supabase/migrations/010_cashier_role.sql`**
- `alter type public.user_role add value if not exists 'cashier';`

**`supabase/migrations/011_cashier_policies.sql`** (run after 010 commits)
- `handle_new_user()`: map the invite metadata role `'cashier'` through faithfully
  (otherwise it collapses to `crew`).
- Recreate the write policies so `cashier` has crew-equivalent reach, plus the new
  close ability:
  - `tabs` INSERT — add `cashier` to the role list (crew-equivalent).
  - `tabs` UPDATE — change from admin-only to **admin OR cashier** (org-scoped). This
    is what powers settling a non-empty tab.
  - `tabs` DELETE (from migration 006) — change to **admin OR cashier** (org-scoped).
    Needed because `closeTab` hard-deletes zero-balance tabs.
  - `orders` INSERT / UPDATE — add `cashier` (crew-equivalent: take orders, advance).
  - `order_items` INSERT — add `cashier` (crew-equivalent).
  - `order_items` UPDATE and all SELECT policies already allow any authenticated
    own-org user, so no change needed there.
- Superadmin bypass and org-scoping predicates are preserved exactly as in 004/006.

### 2. Types — `lib/database.types.ts`

`Role = 'admin' | 'crew' | 'cashier' | 'superadmin'` and the three inline enum
literal unions updated to match.

### 3. Server action — `app/actions/tabs.ts`

`closeTab` guard changes from `profile?.role !== 'admin'` to allow `admin` **or**
`cashier`. Error message: "Only an admin or cashier can close a bill."

### 4. Tab detail page — `app/(app)/tabs/[id]/page.tsx`

`isAdmin` becomes `canCloseTab = me?.role === 'admin' || me?.role === 'cashier'`.
Fallback text becomes "Only an admin or cashier can close the bill."

### 5. Navigation — `components/shared/sidebar-nav.tsx`

- `ROLE_LABELS`: add `cashier: 'Cashier'`.
- Nav items currently scoped to `['admin', 'crew']` (Dashboard, Tabs, Queue) gain
  `'cashier'`. Admin-only items (Menu, Revenue, Users, Settings) stay admin-only.

### 6. User management — `components/admin/user-manager.tsx`

- `ROLE_CONFIG`: add a `cashier` entry (label "Cashier", description
  "Take orders & settle bills", a distinct token-friendly tint + icon).
- Add `<SelectItem value="cashier">Cashier</SelectItem>` to both the invite dropdown
  and the per-user role-change dropdown.

## Out of scope (YAGNI)

No revenue/reporting changes, no separate cashier dashboard, no new audit-event
schema. Cashier reuses the existing close-tab flow and receipt preview verbatim.

## Verification

- `npm run lint`, `npm run type-check`, `npm run build` all pass.
- Manual: invite a cashier → sees Dashboard/Tabs/Queue only; can take an order; can
  close a tab. Crew still sees the "cannot close" message and is blocked by RLS.

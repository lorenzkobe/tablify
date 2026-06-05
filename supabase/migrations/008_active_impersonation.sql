-- ============================================================
-- 008 — Active impersonation state (single source of truth)
--
-- The superadmin "Sign in as" feature previously decided whether to show the
-- "Signed in as …" banner purely from the presence of an HttpOnly cookie. That
-- cookie could go stale (e.g. logout-while-impersonating then log back in),
-- leaving the banner wrongly shown.
--
-- This table is the authoritative record of a currently-live impersonation —
-- one row per superadmin. The HttpOnly cookie still holds the superadmin's
-- restore tokens, but THIS table is what gates the banner; it is deleted on
-- both "Stop impersonating" and logout, so a stale cookie can never resurrect
-- the banner. `impersonation_events` remains the historical start/stop audit log.
-- ============================================================
create table public.active_impersonations (
  superadmin_id  uuid primary key references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- The layout looks this up by the current (target) user during impersonation.
create index on public.active_impersonations(target_user_id);

alter table public.active_impersonations enable row level security;

-- Only superadmin can read directly; server actions and the layout use the
-- service-role (admin) client, since during impersonation the live session is
-- the target user (not a superadmin).
create policy "Superadmin reads active impersonations"
  on public.active_impersonations for select
  to authenticated
  using (public.current_user_role() = 'superadmin');

grant select, insert, update, delete on public.active_impersonations to authenticated;
grant all on public.active_impersonations to service_role;

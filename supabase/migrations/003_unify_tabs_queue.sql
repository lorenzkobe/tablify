-- ============================================================
-- 003 — Unify tabs/tables, single status home, audit + revert
--
-- Model change:
--   * Tables (venue_tables) are removed. A tab's name carries the
--     table identity ("Table 5", "John", "Bar Seat 3").
--   * Orders lose their own status and become "rounds" — a batch of
--     items sent together. Item status is the only status that matters.
--   * Every item status change is recorded in status_events (who/when).
-- ============================================================

-- ------------------------------------------------------------
-- orders: drop tables link + order-level status, require a tab
-- ------------------------------------------------------------
alter table public.orders drop constraint if exists order_has_one_location;

drop index if exists public.orders_table_id_idx;
drop index if exists public.orders_status_idx;

-- Backfill safety: discard any legacy table-only orders that have no tab,
-- so the NOT NULL below cannot fail on existing data.
delete from public.orders where tab_id is null;

alter table public.orders drop column if exists table_id;
alter table public.orders drop column if exists status;
alter table public.orders alter column tab_id set not null;

drop type if exists public.order_status;

-- ------------------------------------------------------------
-- venue_tables: gone entirely
-- ------------------------------------------------------------
alter publication supabase_realtime drop table public.venue_tables;
drop table if exists public.venue_tables;
drop type if exists public.table_status;

-- ------------------------------------------------------------
-- status_events: audit log of item status transitions
-- ------------------------------------------------------------
create table public.status_events (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  from_status   public.order_item_status,
  to_status     public.order_item_status not null,
  actor         uuid not null references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index on public.status_events(order_item_id);

alter table public.status_events enable row level security;

create policy "Authenticated users can read status events"
  on public.status_events for select
  to authenticated
  using (true);

create policy "Authenticated users can insert their own status events"
  on public.status_events for insert
  to authenticated
  with check (actor = auth.uid());

grant select, insert on public.status_events to authenticated;

alter publication supabase_realtime add table public.status_events;

-- ============================================================
-- Roles: collapse server + kitchen into a single "crew" role.
-- Only "admin" and "crew" remain. Admin handles cash, so admin is
-- the only role allowed to close (pay) a tab.
-- ============================================================

-- Drop policies that depend on current_user_role() / the enum before swapping it.
drop policy if exists "Admins and servers can create tabs"        on public.tabs;
drop policy if exists "Admins and servers can update tabs"        on public.tabs;
drop policy if exists "Admins and servers can create orders"      on public.orders;
drop policy if exists "Admins and servers can update orders"      on public.orders;
drop policy if exists "Admins can delete orders"                  on public.orders;
drop policy if exists "Admins and servers can create order items" on public.order_items;
drop policy if exists "Admins can delete order items"             on public.order_items;
drop policy if exists "Admins can update any profile"             on public.profiles;
drop policy if exists "Admins can manage categories"              on public.menu_categories;
drop policy if exists "Admins can manage menu items"              on public.menu_items;

drop function if exists public.current_user_role();

-- Swap the enum: 'admin' stays, everything else becomes 'crew'.
alter type public.user_role rename to user_role_old;
create type public.user_role as enum ('admin', 'crew');

alter table public.profiles alter column role drop default;
alter table public.profiles
  alter column role type public.user_role
  using (case role::text when 'admin' then 'admin' else 'crew' end::public.user_role);
alter table public.profiles alter column role set default 'crew';

drop type public.user_role_old;

-- Recreate the role helper against the new enum.
create or replace function public.current_user_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- New-user trigger: default to crew; only an explicit 'admin' becomes admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when new.raw_user_meta_data->>'role' = 'admin' then 'admin'::public.user_role
         else 'crew'::public.user_role end
  );
  return new;
end;
$$;

-- Recreate policies under the admin/crew model.
create policy "Crew and admins can create tabs"
  on public.tabs for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'crew'));

-- Closing a bill = updating a tab. Admin only (handles cash).
create policy "Only admins can update tabs"
  on public.tabs for update
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Crew and admins can create orders"
  on public.orders for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'crew'));

create policy "Crew and admins can update orders"
  on public.orders for update
  to authenticated
  using (public.current_user_role() in ('admin', 'crew'));

create policy "Admins can delete orders"
  on public.orders for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Crew and admins can create order items"
  on public.order_items for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'crew'));

create policy "Admins can delete order items"
  on public.order_items for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Admins can manage categories"
  on public.menu_categories for all
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Admins can manage menu items"
  on public.menu_items for all
  to authenticated
  using (public.current_user_role() = 'admin');

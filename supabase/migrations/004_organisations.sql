-- ============================================================
-- 004 — Multi-tenancy (organisations), superadmin role, impersonation audit
--
-- Model change:
--   * Each business is an "organisation" that owns its own menu, tabs,
--     orders, users, settings and revenue. Org settings carry the
--     timezone + opening hours used for business-day revenue attribution
--     and the "bar is closed" order restriction.
--   * A new platform-level "superadmin" role sits above org admins:
--     creates orgs, assigns users, and can impersonate ("Sign in as").
--     A superadmin has organisation_id = NULL and bypasses org isolation.
--   * org_id is denormalised onto orders/order_items so RLS is a flat
--     equality check instead of multi-level joins; a BEFORE INSERT trigger
--     copies it down from the parent so it can never diverge.
-- ============================================================

-- ------------------------------------------------------------
-- organisations
-- ------------------------------------------------------------
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  timezone    text not null default 'Asia/Manila',  -- IANA name, drives business-day math
  open_time   time not null default '17:00',
  close_time  time not null default '03:00',         -- if <= open_time, the night crosses midnight
  currency    text not null default 'PHP',           -- ISO 4217
  created_at  timestamptz not null default now()
);

-- Seed a default org (fixed UUID) and backfill all existing single-tenant data into it.
insert into public.organisations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Default Venue', 'default');

-- ============================================================
-- Superadmin role: add 'superadmin' to user_role.
-- Use the rename-swap pattern (same as 003) so the new value is usable
-- immediately. Drop every policy that depends on current_user_role()
-- before dropping the function/enum; they are all recreated below with
-- org isolation baked in.
-- ============================================================
drop policy if exists "Admins can update any profile"          on public.profiles;
drop policy if exists "Users can read all profiles"            on public.profiles;
drop policy if exists "Crew and admins can create tabs"        on public.tabs;
drop policy if exists "Only admins can update tabs"            on public.tabs;
drop policy if exists "Authenticated users can read tabs"      on public.tabs;
drop policy if exists "Crew and admins can create orders"      on public.orders;
drop policy if exists "Crew and admins can update orders"      on public.orders;
drop policy if exists "Admins can delete orders"               on public.orders;
drop policy if exists "Authenticated users can read orders"    on public.orders;
drop policy if exists "Crew and admins can create order items" on public.order_items;
drop policy if exists "Admins can delete order items"          on public.order_items;
drop policy if exists "Authenticated users can read order items" on public.order_items;
drop policy if exists "All roles can update order item status" on public.order_items;
drop policy if exists "Admins can manage categories"           on public.menu_categories;
drop policy if exists "Authenticated users can read categories" on public.menu_categories;
drop policy if exists "Admins can manage menu items"           on public.menu_items;
drop policy if exists "Authenticated users can read menu items" on public.menu_items;
drop policy if exists "Authenticated users can read status events" on public.status_events;

drop function if exists public.current_user_role();

alter type public.user_role rename to user_role_old;
create type public.user_role as enum ('admin', 'crew', 'superadmin');

alter table public.profiles alter column role drop default;
alter table public.profiles
  alter column role type public.user_role
  using (role::text::public.user_role);
alter table public.profiles alter column role set default 'crew';

drop type public.user_role_old;

-- ------------------------------------------------------------
-- org ownership columns (nullable first, then backfill, then enforce)
-- profiles.organisation_id stays NULLABLE — a superadmin belongs to no org.
-- ------------------------------------------------------------
alter table public.profiles        add column organisation_id uuid references public.organisations(id);
alter table public.tabs            add column organisation_id uuid references public.organisations(id);
alter table public.menu_categories add column organisation_id uuid references public.organisations(id);
alter table public.menu_items      add column organisation_id uuid references public.organisations(id);
alter table public.orders          add column organisation_id uuid references public.organisations(id);
alter table public.order_items     add column organisation_id uuid references public.organisations(id);

update public.profiles        set organisation_id = '00000000-0000-0000-0000-000000000001' where organisation_id is null;
update public.tabs            set organisation_id = '00000000-0000-0000-0000-000000000001' where organisation_id is null;
update public.menu_categories set organisation_id = '00000000-0000-0000-0000-000000000001' where organisation_id is null;
update public.menu_items      set organisation_id = '00000000-0000-0000-0000-000000000001' where organisation_id is null;
update public.orders          set organisation_id = '00000000-0000-0000-0000-000000000001' where organisation_id is null;
update public.order_items     set organisation_id = '00000000-0000-0000-0000-000000000001' where organisation_id is null;

-- All operational tables require an org; profiles intentionally does not (superadmin).
alter table public.tabs            alter column organisation_id set not null;
alter table public.menu_categories alter column organisation_id set not null;
alter table public.menu_items      alter column organisation_id set not null;
alter table public.orders          alter column organisation_id set not null;
alter table public.order_items     alter column organisation_id set not null;

create index on public.profiles(organisation_id);
create index on public.tabs(organisation_id);
create index on public.menu_categories(organisation_id);
create index on public.menu_items(organisation_id);
create index on public.orders(organisation_id);
create index on public.order_items(organisation_id);

-- Revenue query filters on order_items.created_at; not previously indexed.
create index on public.order_items(created_at);

-- ------------------------------------------------------------
-- inherit org_id from parent on insert (orders <- tabs, order_items <- orders)
-- ------------------------------------------------------------
create or replace function public.inherit_org_id()
returns trigger
language plpgsql
as $$
begin
  if new.organisation_id is null then
    if tg_table_name = 'orders' then
      select organisation_id into new.organisation_id from public.tabs where id = new.tab_id;
    elsif tg_table_name = 'order_items' then
      select organisation_id into new.organisation_id from public.orders where id = new.order_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_inherit_org
  before insert on public.orders
  for each row execute procedure public.inherit_org_id();

create trigger order_items_inherit_org
  before insert on public.order_items
  for each row execute procedure public.inherit_org_id();

-- ============================================================
-- RLS helpers (security definer so they read profiles without recursing
-- through profiles' own policies — same reason current_user_role() does).
-- ============================================================
create or replace function public.current_user_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_org()
returns uuid
language sql stable
security definer set search_path = public
as $$
  select organisation_id from public.profiles where id = auth.uid()
$$;

-- New-user trigger: read role + organisation_id from invite metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, organisation_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case new.raw_user_meta_data->>'role'
      when 'admin' then 'admin'::public.user_role
      when 'superadmin' then 'superadmin'::public.user_role
      else 'crew'::public.user_role end,
    (new.raw_user_meta_data->>'organisation_id')::uuid
  );
  return new;
end;
$$;

-- ============================================================
-- Recreate policies with org isolation. The shared predicate is:
--   superadmin (bypass) OR row's org matches the caller's org.
-- Writes keep their role gate AND the org predicate.
-- ============================================================

-- organisations: read own org; superadmin manages all.
alter table public.organisations enable row level security;

create policy "Users read own organisation"
  on public.organisations for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or id = public.current_user_org());

create policy "Superadmin manages organisations"
  on public.organisations for all
  to authenticated
  using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

-- profiles
create policy "Users read own-org profiles"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() in ('admin', 'superadmin'));

-- tabs
create policy "Users read own-org tabs"
  on public.tabs for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Crew and admins create own-org tabs"
  on public.tabs for insert
  to authenticated
  with check (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'superadmin')
  );

create policy "Admins update own-org tabs"
  on public.tabs for update
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  );

-- orders
create policy "Users read own-org orders"
  on public.orders for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Crew and admins create own-org orders"
  on public.orders for insert
  to authenticated
  with check (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'superadmin')
  );

create policy "Crew and admins update own-org orders"
  on public.orders for update
  to authenticated
  using (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'superadmin')
  );

create policy "Admins delete own-org orders"
  on public.orders for delete
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  );

-- order_items
create policy "Users read own-org order items"
  on public.order_items for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Crew and admins create own-org order items"
  on public.order_items for insert
  to authenticated
  with check (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'superadmin')
  );

create policy "Users update own-org order items"
  on public.order_items for update
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Admins delete own-org order items"
  on public.order_items for delete
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  );

-- menu_categories
create policy "Users read own-org categories"
  on public.menu_categories for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Admins manage own-org categories"
  on public.menu_categories for all
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  )
  with check (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  );

-- menu_items
create policy "Users read own-org menu items"
  on public.menu_items for select
  to authenticated
  using (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org());

create policy "Admins manage own-org menu items"
  on public.menu_items for all
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  )
  with check (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  );

-- status_events: read scoped via the parent order_item's org.
create policy "Users read own-org status events"
  on public.status_events for select
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or exists (
      select 1 from public.order_items oi
      where oi.id = status_events.order_item_id
        and oi.organisation_id = public.current_user_org()
    )
  );

-- ============================================================
-- impersonation_events: audit trail for superadmin "Sign in as".
-- ============================================================
create table public.impersonation_events (
  id             uuid primary key default gen_random_uuid(),
  superadmin_id  uuid not null references public.profiles(id),
  target_user_id uuid not null references public.profiles(id),
  action         text not null check (action in ('start', 'stop')),
  created_at     timestamptz not null default now()
);

create index on public.impersonation_events(superadmin_id);

alter table public.impersonation_events enable row level security;

create policy "Superadmin reads impersonation events"
  on public.impersonation_events for select
  to authenticated
  using (public.current_user_role() = 'superadmin');

-- ============================================================
-- GRANTs for the new tables (required for new Supabase projects).
-- ============================================================
grant select, insert, update, delete on public.organisations to authenticated;
grant select, insert, update, delete on public.impersonation_events to authenticated;
grant all on public.organisations to service_role;
grant all on public.impersonation_events to service_role;

-- ============================================================
-- Bootstrap: promote the first superadmin (no org).
-- The owner must already exist (signed up / invited) for this to match.
-- ============================================================
update public.profiles
set role = 'superadmin', organisation_id = null
where id = (select id from auth.users where email = '142924@gmail.com');

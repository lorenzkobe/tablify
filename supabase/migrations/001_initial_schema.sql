-- ============================================================
-- Enums
-- ============================================================
create type public.user_role as enum ('admin', 'server', 'kitchen');
create type public.table_status as enum ('available', 'occupied');
create type public.tab_status as enum ('open', 'closed');
create type public.order_status as enum ('pending', 'in_progress', 'ready', 'served', 'paid', 'cancelled');
create type public.order_item_status as enum ('ordered', 'in_progress', 'ready', 'served', 'returned');

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        public.user_role not null default 'server',
  created_at  timestamptz not null default now()
);

-- Auto-create profile on new user signup
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
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'server')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Venue Tables
-- ============================================================
create table public.venue_tables (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  capacity    int not null default 4,
  status      public.table_status not null default 'available',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Tabs (walk-up / no-table orders)
-- ============================================================
create table public.tabs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  status      public.tab_status not null default 'open',
  opened_by   uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);

-- ============================================================
-- Orders
-- ============================================================
create table public.orders (
  id          uuid primary key default gen_random_uuid(),
  table_id    uuid references public.venue_tables(id) on delete set null,
  tab_id      uuid references public.tabs(id) on delete set null,
  taken_by    uuid not null references public.profiles(id),
  status      public.order_status not null default 'pending',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Exactly one of table_id or tab_id must be set
  constraint order_has_one_location check (
    (table_id is not null)::int + (tab_id is not null)::int = 1
  )
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Menu Categories
-- ============================================================
create table public.menu_categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  sort  int not null default 0
);

-- ============================================================
-- Menu Items
-- ============================================================
create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.menu_categories(id) on delete cascade,
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  available    boolean not null default true,
  sort         int not null default 0
);

-- ============================================================
-- Order Items
-- ============================================================
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  menu_item_id  uuid not null references public.menu_items(id),
  quantity      int not null default 1 check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  status        public.order_item_status not null default 'ordered',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger order_items_updated_at
  before update on public.order_items
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================
create index on public.orders(table_id) where table_id is not null;
create index on public.orders(tab_id) where tab_id is not null;
create index on public.orders(status);
create index on public.order_items(order_id);
create index on public.order_items(status);
create index on public.menu_items(category_id);
create index on public.tabs(status);

-- ============================================================
-- Enable Realtime
-- ============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.venue_tables;
alter publication supabase_realtime add table public.tabs;

-- ============================================================
-- Explicit GRANTs (required for new Supabase projects ≥ May 30 2026)
-- Without these, supabase-js / PostgREST returns a 42501 error.
-- ============================================================
grant select, insert, update, delete
  on public.profiles
  to authenticated;

grant select, insert, update, delete
  on public.venue_tables
  to authenticated;

grant select, insert, update, delete
  on public.tabs
  to authenticated;

grant select, insert, update, delete
  on public.orders
  to authenticated;

grant select, insert, update, delete
  on public.order_items
  to authenticated;

grant select, insert, update, delete
  on public.menu_categories
  to authenticated;

grant select, insert, update, delete
  on public.menu_items
  to authenticated;

-- service_role needs full access for admin operations (e.g. inviteUserByEmail triggers)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

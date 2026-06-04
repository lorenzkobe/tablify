-- ============================================================
-- Row Level Security
-- ============================================================

-- Helper: get current user's role
create or replace function public.current_user_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- profiles
-- ============================================================
alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin');

-- ============================================================
-- venue_tables
-- ============================================================
alter table public.venue_tables enable row level security;

create policy "Authenticated users can read tables"
  on public.venue_tables for select
  to authenticated
  using (true);

create policy "Admins and servers can insert tables"
  on public.venue_tables for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'server'));

create policy "Admins and servers can update tables"
  on public.venue_tables for update
  to authenticated
  using (public.current_user_role() in ('admin', 'server'));

create policy "Admins can delete tables"
  on public.venue_tables for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ============================================================
-- tabs
-- ============================================================
alter table public.tabs enable row level security;

create policy "Authenticated users can read tabs"
  on public.tabs for select
  to authenticated
  using (true);

create policy "Admins and servers can create tabs"
  on public.tabs for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'server'));

create policy "Admins and servers can update tabs"
  on public.tabs for update
  to authenticated
  using (public.current_user_role() in ('admin', 'server'));

-- ============================================================
-- orders
-- ============================================================
alter table public.orders enable row level security;

create policy "Authenticated users can read orders"
  on public.orders for select
  to authenticated
  using (true);

create policy "Admins and servers can create orders"
  on public.orders for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'server'));

create policy "Admins and servers can update orders"
  on public.orders for update
  to authenticated
  using (public.current_user_role() in ('admin', 'server'));

create policy "Admins can delete orders"
  on public.orders for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ============================================================
-- menu_categories
-- ============================================================
alter table public.menu_categories enable row level security;

create policy "Authenticated users can read categories"
  on public.menu_categories for select
  to authenticated
  using (true);

create policy "Admins can manage categories"
  on public.menu_categories for all
  to authenticated
  using (public.current_user_role() = 'admin');

-- ============================================================
-- menu_items
-- ============================================================
alter table public.menu_items enable row level security;

create policy "Authenticated users can read menu items"
  on public.menu_items for select
  to authenticated
  using (true);

create policy "Admins can manage menu items"
  on public.menu_items for all
  to authenticated
  using (public.current_user_role() = 'admin');

-- ============================================================
-- order_items
-- ============================================================
alter table public.order_items enable row level security;

create policy "Authenticated users can read order items"
  on public.order_items for select
  to authenticated
  using (true);

create policy "Admins and servers can create order items"
  on public.order_items for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'server'));

create policy "All roles can update order item status"
  on public.order_items for update
  to authenticated
  using (true);

create policy "Admins can delete order items"
  on public.order_items for delete
  to authenticated
  using (public.current_user_role() = 'admin');

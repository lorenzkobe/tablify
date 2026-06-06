-- ============================================================
-- 011 — Grant the 'cashier' role its permissions
--
-- MUST run after 010 has committed (Postgres cannot use a newly added enum
-- value in the transaction that created it).
--
-- cashier mirrors crew operationally (take orders, work tabs/queue) and adds
-- the close-bill power that crew lacks:
--   * tabs UPDATE / DELETE — was admin-only, now admin OR cashier (the close
--     flow updates a non-empty tab and hard-deletes a zero-balance one).
--   * tabs INSERT, orders INSERT/UPDATE, order_items INSERT — add cashier to
--     the crew-equivalent role list.
-- SELECT policies and order_items UPDATE already allow any authenticated
-- own-org user, so they need no change. Superadmin bypass + org-scoping are
-- preserved exactly as in 004/006.
-- ============================================================

-- New-user trigger: carry 'cashier' through from invite metadata instead of
-- collapsing it to crew.
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
      when 'cashier' then 'cashier'::public.user_role
      when 'superadmin' then 'superadmin'::public.user_role
      else 'crew'::public.user_role end,
    (new.raw_user_meta_data->>'organisation_id')::uuid
  );
  return new;
end;
$$;

-- tabs INSERT — crew-equivalent reach.
drop policy if exists "Crew and admins create own-org tabs" on public.tabs;
create policy "Crew and admins create own-org tabs"
  on public.tabs for insert
  to authenticated
  with check (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'cashier', 'superadmin')
  );

-- tabs UPDATE — admin OR cashier (settle a non-empty tab).
drop policy if exists "Admins update own-org tabs" on public.tabs;
create policy "Admins update own-org tabs"
  on public.tabs for update
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() in ('admin', 'cashier') and organisation_id = public.current_user_org())
  );

-- tabs DELETE — admin OR cashier (close hard-deletes a zero-balance tab).
drop policy if exists "Admins delete own-org tabs" on public.tabs;
create policy "Admins delete own-org tabs"
  on public.tabs for delete
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() in ('admin', 'cashier') and organisation_id = public.current_user_org())
  );

-- orders INSERT — crew-equivalent reach.
drop policy if exists "Crew and admins create own-org orders" on public.orders;
create policy "Crew and admins create own-org orders"
  on public.orders for insert
  to authenticated
  with check (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'cashier', 'superadmin')
  );

-- orders UPDATE — crew-equivalent reach.
drop policy if exists "Crew and admins update own-org orders" on public.orders;
create policy "Crew and admins update own-org orders"
  on public.orders for update
  to authenticated
  using (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'cashier', 'superadmin')
  );

-- order_items INSERT — crew-equivalent reach.
drop policy if exists "Crew and admins create own-org order items" on public.order_items;
create policy "Crew and admins create own-org order items"
  on public.order_items for insert
  to authenticated
  with check (
    (public.current_user_role() = 'superadmin' or organisation_id = public.current_user_org())
    and public.current_user_role() in ('admin', 'crew', 'cashier', 'superadmin')
  );

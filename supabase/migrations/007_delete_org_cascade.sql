-- ============================================================
-- 007 — Let a superadmin delete an organisation
--
-- 004 added organisation_id FKs to profiles, tabs, menu_categories,
-- menu_items, orders and order_items without ON DELETE behaviour (default
-- NO ACTION). That makes deleting an organisation impossible — Postgres
-- raises a foreign-key violation from every owned row.
--
-- Repoint those FKs so a delete is a clean teardown:
--   * Business data (tabs, menu_categories, menu_items, orders,
--     order_items) is owned by the org -> ON DELETE CASCADE. These columns
--     stay NOT NULL; the rows are removed with the org.
--   * profiles.organisation_id stays NULLABLE -> ON DELETE SET NULL. The
--     member accounts survive (and can be reassigned) — only the link to
--     the deleted org is cleared.
--
-- The FKs use Postgres' default name <table>_organisation_id_fkey (004 added
-- the columns without naming the constraints).
-- ============================================================

-- profiles: detach members, preserve accounts (column stays nullable).
alter table public.profiles drop constraint if exists profiles_organisation_id_fkey;
alter table public.profiles
  add constraint profiles_organisation_id_fkey
  foreign key (organisation_id) references public.organisations(id) on delete set null;

-- tabs
alter table public.tabs drop constraint if exists tabs_organisation_id_fkey;
alter table public.tabs
  add constraint tabs_organisation_id_fkey
  foreign key (organisation_id) references public.organisations(id) on delete cascade;

-- menu_categories
alter table public.menu_categories drop constraint if exists menu_categories_organisation_id_fkey;
alter table public.menu_categories
  add constraint menu_categories_organisation_id_fkey
  foreign key (organisation_id) references public.organisations(id) on delete cascade;

-- menu_items
alter table public.menu_items drop constraint if exists menu_items_organisation_id_fkey;
alter table public.menu_items
  add constraint menu_items_organisation_id_fkey
  foreign key (organisation_id) references public.organisations(id) on delete cascade;

-- orders
alter table public.orders drop constraint if exists orders_organisation_id_fkey;
alter table public.orders
  add constraint orders_organisation_id_fkey
  foreign key (organisation_id) references public.organisations(id) on delete cascade;

-- order_items
alter table public.order_items drop constraint if exists order_items_organisation_id_fkey;
alter table public.order_items
  add constraint order_items_organisation_id_fkey
  foreign key (organisation_id) references public.organisations(id) on delete cascade;

-- ============================================================
-- Migration 009: Unique menu item names per organisation
-- ============================================================
-- Menu item names must be unique within an organisation, case-insensitively.
-- "Mojito" and "mojito" are treated as the same name. Different organisations
-- may each have their own "Mojito".
--
-- NOTE: if existing data already contains case-insensitive duplicate names
-- within an organisation, this index creation will fail. Resolve duplicates
-- (rename or remove) before applying.

create unique index if not exists menu_items_org_name_unique
  on public.menu_items (organisation_id, lower(name));

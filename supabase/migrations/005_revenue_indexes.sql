-- ============================================================
-- 005 — Composite indexes for org-scoped read paths
--
-- 004 added one index per organisation_id column plus a standalone
-- order_items(created_at). Those serve a single dimension, but the hot reads
-- filter on TWO: RLS pins organisation_id and the page adds a second predicate
-- (a created_at window for revenue, item status for the KDS, tab status for
-- the dashboard).
--
-- Replace those standalone indexes with composites that lead on organisation_id.
-- A composite's leftmost prefix still answers plain org-only lookups, so the
-- single-column organisation_id index becomes redundant on the covered tables.
--
-- Note: orders has no status column (dropped in 003 — orders are statusless
-- "rounds"), so its 004 organisation_id index is left as-is. The KDS status
-- filter lives on order_items.status, not orders.
-- ============================================================

-- order_items: revenue scans an org's items in a time window; the KDS reads an
-- org's items by status. Two distinct read paths -> two composites.
drop index if exists public.order_items_organisation_id_idx;
drop index if exists public.order_items_created_at_idx;
create index on public.order_items(organisation_id, created_at);
create index on public.order_items(organisation_id, status);

-- tabs: dashboard reads open tabs for an org.
drop index if exists public.tabs_organisation_id_idx;
create index on public.tabs(organisation_id, status);

-- ============================================================
-- 010 — Add the 'cashier' role
--
-- cashier = crew + the ability to close/settle tabs. It exists so checkout
-- can happen when an admin is not on the premises, without exposing admin
-- surfaces (users, organisation, revenue, menu, settings).
--
-- Migrations 003/004 swapped the whole enum via a rename because they were
-- *removing/collapsing* values. We are purely *adding* one, so ADD VALUE is
-- the correct, lower-risk tool — no need to drop and recreate every policy.
--
-- Postgres forbids USING a newly added enum value in the same transaction it
-- was created in, so the policy changes that reference 'cashier' live in the
-- separate migration 011. Run 010 first and let it commit before 011.
-- ============================================================

alter type public.user_role add value if not exists 'cashier';

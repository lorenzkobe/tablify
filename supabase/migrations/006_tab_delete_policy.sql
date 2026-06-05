-- ============================================================
-- 006 — Allow admins to delete their own-org tabs
--
-- Closing an empty (zero-balance) tab hard-deletes it rather than leaving a
-- closed shell behind (see closeTab in app/actions/tabs.ts). The tabs table had
-- select/insert/update policies but never a delete policy, so under RLS the
-- delete silently affected zero rows and the tab survived.
--
-- Mirror the org-scoped admin update policy. Child rounds are removed first by
-- the action (orders.tab_id is ON DELETE SET NULL, and orders require a
-- location), which cascades to order_items and status_events — both already
-- covered by their own admin delete policies.
-- ============================================================

create policy "Admins delete own-org tabs"
  on public.tabs for delete
  to authenticated
  using (
    public.current_user_role() = 'superadmin'
    or (public.current_user_role() = 'admin' and organisation_id = public.current_user_org())
  );

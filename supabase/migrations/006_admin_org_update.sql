-- 006 — Let an admin edit their own organisation's settings.
--
-- 004 gave admins SELECT on their own org but reserved every write to the
-- superadmin ("Superadmin manages organisations", FOR ALL). Admins own the
-- business, so they should be able to tune its operational settings
-- (name, timezone, opening hours, currency) for their own org only.
--
-- This is UPDATE-only: admins still cannot create or delete organisations, and
-- the USING/WITH CHECK both pin the row to current_user_org() so an admin can
-- never retarget another organisation. The server action additionally restricts
-- which columns may change (it never writes id, slug, or organisation_id).

create policy "Admin updates own organisation"
  on public.organisations for update
  to authenticated
  using (public.current_user_role() = 'admin' and id = public.current_user_org())
  with check (public.current_user_role() = 'admin' and id = public.current_user_org());

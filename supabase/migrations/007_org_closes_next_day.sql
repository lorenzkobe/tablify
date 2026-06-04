-- Make the "night crosses midnight" property explicit and user-controlled.
--
-- Previously the +1 day indicator was derived (close_time <= open_time). That
-- can't express schedules where the close time falls on the same calendar day
-- as the open even though it's numerically earlier, or 24h-style operations.
-- Store it as a real flag, defaulting existing rows to the old derived value.

alter table public.organisations
  add column closes_next_day boolean not null default false;

update public.organisations
  set closes_next_day = (close_time <= open_time);

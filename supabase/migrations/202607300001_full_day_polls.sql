-- Slotly full-day polls.
-- Existing polls remain time-slot polls by default.

alter table public.events
  add column if not exists is_full_day boolean not null default false;

comment on column public.events.is_full_day is
  'When true, participants choose whole dates instead of hourly availability slots.';

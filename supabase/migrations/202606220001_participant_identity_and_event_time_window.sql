-- Slotly participant identity and event time window.
-- Safe to run after the MVP repair migration.

create extension if not exists unaccent;

create or replace function public.normalize_participant_name(raw_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(lower(public.unaccent(btrim(raw_name))), '\s+', ' ', 'g');
$$;

alter table public.events
  add column if not exists start_time time not null default time '18:00',
  add column if not exists end_time time not null default time '22:00';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_time_range_order'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_time_range_order check (start_time < end_time);
  end if;
end;
$$;

alter table public.participants
  add column if not exists normalized_name text;

update public.participants
set normalized_name = public.normalize_participant_name(name)
where normalized_name is null;

alter table public.participants
  alter column normalized_name set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'participants_normalized_name_not_blank'
      and conrelid = 'public.participants'::regclass
  ) then
    alter table public.participants
      add constraint participants_normalized_name_not_blank
      check (length(normalized_name) > 0);
  end if;
end;
$$;

create unique index if not exists participants_event_id_normalized_name_key
  on public.participants(event_id, normalized_name);

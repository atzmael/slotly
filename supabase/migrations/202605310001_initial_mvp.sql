-- Slotly MVP schema.
-- Accountless public-link polls, with server-side writes and narrow public reads.

create extension if not exists pgcrypto;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  duration_minutes integer not null,
  slot_size_minutes integer not null,
  created_at timestamptz not null default now(),

  constraint events_title_not_blank check (length(btrim(title)) > 0),
  constraint events_title_length check (char_length(title) <= 80),
  constraint events_date_range_order check (start_date <= end_date),
  constraint events_date_range_max check (end_date <= start_date + 31),
  constraint events_duration_allowed check (
    duration_minutes in (30, 60, 120, 180, 240)
  ),
  constraint events_slot_size_allowed check (slot_size_minutes in (30, 60))
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint participants_name_not_blank check (length(btrim(name)) > 0),
  constraint participants_name_length check (char_length(name) <= 60),
  constraint participants_timezone_length check (char_length(timezone) <= 80)
);

create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint availability_windows_order check (start_at < end_at)
);

create index events_created_at_idx on public.events(created_at desc);
create index participants_event_id_idx on public.participants(event_id);
create index availability_windows_participant_id_idx
  on public.availability_windows(participant_id);
create index availability_windows_range_idx
  on public.availability_windows(start_at, end_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger participants_touch_updated_at
before update on public.participants
for each row execute function public.touch_updated_at();

create trigger availability_windows_touch_updated_at
before update on public.availability_windows
for each row execute function public.touch_updated_at();

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.availability_windows enable row level security;

-- The MVP writes through Next server services using the service role key.
-- Direct anon table access stays closed; public reads go through a narrow RPC.

create or replace function public.get_event_snapshot(public_event_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'event',
    to_jsonb(e),
    'participants',
    coalesce(
      (
        select jsonb_agg(to_jsonb(p) order by p.created_at, p.name)
        from public.participants p
        where p.event_id = e.id
      ),
      '[]'::jsonb
    ),
    'availabilityWindows',
    coalesce(
      (
        select jsonb_agg(to_jsonb(aw) order by aw.start_at, aw.end_at)
        from public.availability_windows aw
        join public.participants p on p.id = aw.participant_id
        where p.event_id = e.id
      ),
      '[]'::jsonb
    )
  )
  from public.events e
  where e.id = public_event_id;
$$;

revoke all on function public.get_event_snapshot(uuid) from public;
grant execute on function public.get_event_snapshot(uuid) to anon, authenticated;

comment on table public.events is
  'Accountless Slotly availability polls. The id is the public share token.';
comment on table public.participants is
  'Accountless poll participants with a display name and detected timezone.';
comment on table public.availability_windows is
  'Normalized available windows. Missing windows mean not available.';
comment on function public.get_event_snapshot(uuid) is
  'Narrow public read model for one event link.';

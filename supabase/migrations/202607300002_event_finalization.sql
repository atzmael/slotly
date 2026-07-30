-- Slotly event finalization.
-- Accountless creators get a private creator token stored as a server cookie.
-- Only the token hash is persisted.

alter table public.events
  add column if not exists creator_token_hash text,
  add column if not exists finalized_start_at timestamptz,
  add column if not exists finalized_end_at timestamptz,
  add column if not exists finalized_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_creator_token_hash_length'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_creator_token_hash_length
      check (creator_token_hash is null or char_length(creator_token_hash) = 64);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_finalized_window_complete'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_finalized_window_complete
      check (
        (
          finalized_start_at is null
          and finalized_end_at is null
          and finalized_at is null
        )
        or (
          finalized_start_at is not null
          and finalized_end_at is not null
          and finalized_at is not null
          and finalized_start_at < finalized_end_at
        )
      );
  end if;
end;
$$;

comment on column public.events.creator_token_hash is
  'SHA-256 hash of the accountless creator token. The raw token stays in a server cookie.';
comment on column public.events.finalized_start_at is
  'Chosen definitive event start. When set, voting is locked.';
comment on column public.events.finalized_end_at is
  'Chosen definitive event end. When set, voting is locked.';
comment on column public.events.finalized_at is
  'Timestamp at which the creator finalized the poll.';

create or replace function public.get_event_snapshot(public_event_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'event',
    to_jsonb(e) - 'creator_token_hash',
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

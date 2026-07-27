-- Slotly stale event cleanup.
-- Deletes accountless polls after the event has ended and no activity happened
-- within the retention window.

create or replace function public.delete_stale_events(retention_days integer default 14)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if retention_days < 1 or retention_days > 365 then
    raise exception 'retention_days must be between 1 and 365';
  end if;

  with stale_events as (
    select e.id
    from public.events e
    where e.end_date <= current_date - retention_days
      and greatest(
        e.created_at,
        coalesce(
          (
            select max(p.updated_at)
            from public.participants p
            where p.event_id = e.id
          ),
          e.created_at
        ),
        coalesce(
          (
            select max(aw.updated_at)
            from public.availability_windows aw
            join public.participants p on p.id = aw.participant_id
            where p.event_id = e.id
          ),
          e.created_at
        )
      ) < now() - make_interval(days => retention_days)
  )
  delete from public.events e
  using stale_events s
  where e.id = s.id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_stale_events(integer) from public;
grant execute on function public.delete_stale_events(integer) to service_role;

comment on function public.delete_stale_events(integer) is
  'Deletes polls whose end date and latest activity are older than the retention window.';

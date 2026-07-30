# Supabase

Slotly stores the MVP data in Supabase Postgres.

## Migrations

Migrations live in `supabase/migrations`.

Initial schema:

- `events`
- `participants`
- `availability_windows`
- `get_event_snapshot(event_id)` public RPC for narrow link-based reads
- `delete_stale_events(retention_days)` service-only RPC for scheduled cleanup
- `events.is_full_day` for date-only availability polls

The MVP is accountless. Next server services should use `SUPABASE_SECRET_KEY` for writes. Direct anonymous table access is intentionally closed by RLS; public reads should go through RPCs that accept a non-enumerable event id.

## Environment

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Use Supabase's current API key names:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` maps to the browser-safe publishable key.
- `SUPABASE_SECRET_KEY` maps to the server-only secret key.

Do not use legacy `anon` / `service_role` naming in app env vars.

## Apply

Use the Supabase CLI or paste the SQL into the SQL editor for the target project:

```bash
supabase db push
```

## Realtime

Slotly currently uses Supabase Realtime Broadcast, not Postgres changes:

- clients subscribe to topic `event:{eventId}`;
- successful join and availability saves broadcast `event_changed`;
- open event/results pages call `router.refresh()`;
- table RLS can stay closed to anonymous direct reads.

No `alter publication supabase_realtime add table ...` step is required for this implementation.

## Scheduled Cleanup

Production runs `/api/cron/cleanup-stale-events` daily through Vercel Cron.

- Set `CRON_SECRET` in Vercel so the route can verify the cron request.
- Vercel Cron automatically sends it as
  `Authorization: Bearer <CRON_SECRET>` when invoking the configured path.
- The cleanup deletes polls whose `end_date` is at least 14 days old and whose
  latest activity is older than 14 days.
- Activity is computed from `events.created_at`, `participants.updated_at`, and
  `availability_windows.updated_at`.
- Deleting an event cascades to participants and availability windows.

## Production Checklist

- Confirm the initial migration is applied once to the production Supabase project.
- Confirm the stale event cleanup migration is applied.
- Confirm the full-day polls migration is applied before testing date-only polls.
- Confirm RLS is enabled on `events`, `participants`, and `availability_windows`.
- Confirm anonymous direct table reads remain closed.
- Confirm `get_event_snapshot(uuid)` is executable by `anon`.
- Confirm Vercel has all three Supabase env vars and `CRON_SECRET`.
- Run `pnpm build` before deploy.
- Run `pnpm e2e` against a local server connected to the target Supabase project before the first public test.

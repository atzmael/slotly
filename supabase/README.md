# Supabase

Slotly stores the MVP data in Supabase Postgres.

## Migrations

Migrations live in `supabase/migrations`.

Initial schema:

- `events`
- `participants`
- `availability_windows`
- `get_event_snapshot(event_id)` public RPC for narrow link-based reads

The MVP is accountless. Next server services should use `SUPABASE_SECRET_KEY` for writes. Direct anonymous table access is intentionally closed by RLS; public reads should go through RPCs that accept a non-enumerable event id.

## Environment

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

## Apply

Use the Supabase CLI or paste the SQL into the SQL editor for the target project:

```bash
supabase db push
```

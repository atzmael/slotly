# Slotly

Slotly is a mobile-first, accountless availability poll app: create a link, collect availability, instantly know the best time to meet.

The MVP is intentionally small:

- no accounts;
- no onboarding;
- shareable event links;
- automatic timezone handling;
- mobile-first availability grid;
- automatic best-slot ranking.

## Source Of Truth

Canonical decisions live in `ADR/`:

- `ADR/slotly.md`
- `ADR/slotly-ux.md`
- `ADR/slotly/`

The implementation plan lives in `IMPLEMENTATION_PLAN.md`.

## Source Layout

Current layout:

- `src/app` - Next.js routes and route handlers.
- `src/domain` - pure product rules, deterministic and DB-free.
- `src/server` - server-only services, validation, and persistence.
- `src/client` - browser-only service clients.
- `supabase/migrations` - database schema migrations.
- `tests/e2e` - Playwright happy-path coverage.

## Minimal UI System

Shared UI primitives live in `src/app/globals.css` and use the `sl-*` prefix:

- `sl-button`, `sl-button-primary`, `sl-button-secondary`
- `sl-field`
- `sl-panel`
- `sl-alert`, `sl-alert-error`, `sl-alert-success`

Keep new route UI on these primitives before adding new styling patterns.
Interactive elements should preserve hover, focus, active, disabled, and cursor
states.

## Environment

Local development and Vercel need these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` is server-only. Do not expose it to browser code.

Optional local mode flag:

```bash
APP_ACCESS_MODE=public
```

## Local Development

Use the conservative webpack dev server by default:

```bash
pnpm dev
```

If you want to test Turbopack explicitly:

```bash
pnpm dev:turbo
```

If local dev becomes unstable, stop the server and prefer `pnpm dev` before
retrying Turbopack.

## Supabase

Apply the migrations in `supabase/migrations` to the target Supabase project before deploying the app.

The MVP keeps direct anonymous table access closed with RLS. Public reads go through the `get_event_snapshot` RPC, and server writes use `SUPABASE_SECRET_KEY`.

Realtime uses Supabase Broadcast topics named `event:{eventId}`. No Postgres table publication is required for the current realtime refresh behavior.

## Deploy Checklist

- Supabase project created.
- Migration `202605310001_initial_mvp.sql` applied.
- `NEXT_PUBLIC_SUPABASE_URL` configured in Vercel.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured in Vercel.
- `SUPABASE_SECRET_KEY` configured in Vercel as a server-only secret.
- `CRON_SECRET` configured in Vercel for scheduled cleanup.
- `pnpm build` passes locally.
- `pnpm audit --prod` has no high or moderate production findings.
- `pnpm e2e` passes locally against the target environment variables.
- Vercel preview opens `/new`.
- Preview happy path works: create poll, join, save availability, view results.
- Vercel Firewall or another edge protection is ready if public traffic spikes.

## Quality Checks

Expected commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
pnpm build
```

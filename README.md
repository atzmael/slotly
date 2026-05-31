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

Target layout once the app is bootstrapped:

- `src/app` - Next.js routes and route handlers.
- `src/domain` - pure product rules, deterministic and DB-free.
- `src/server` - server-only services, validation, persistence, realtime, and side effects.
- `src/features` - reusable UI and workflow modules.
- `src/components/ui` - shared UI primitives.
- `src/i18n` - dictionaries and translation helpers when localization is enabled.

## Quality Checks

Expected commands once the stack is installed:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

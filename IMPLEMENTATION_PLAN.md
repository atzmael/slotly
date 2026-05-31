# Slotly - Implementation Plan

> Vue d'ensemble de l'implementation. Les ADR restent la source de verite produit et architecture ; ce document sert a transformer le scope en milestones et tickets GitHub.

## Milestones

1. `P0 - Project Foundation`
2. `P1 - Availability Domain`
3. `P2 - Create Poll`
4. `P3 - Join Poll`
5. `P4 - Results & Ranking`
6. `P5 - Realtime & Polish`
7. `P6 - Observability & Hardening`

## Recommended Order

1. P0 complete.
2. P1 domain model and availability engine.
3. P2 event creation flow.
4. P3 participant availability flow.
5. P4 results ranking and heatmap.
6. P5 realtime updates and mobile polish.
7. P6 production hardening.

The MVP is accountless. Do not add authentication, onboarding, notifications, calendar integrations, Discord integrations, recurring events, AI, payments, or team management unless the ADR changes first. Monetization must preserve the free, accountless core described in `ADR/slotly/monetization.md`.

## Ticket Template

Each GitHub issue should include:

- objective;
- related ADR;
- explicit business rules copied or summarized from the ADR;
- included scope;
- excluded scope;
- acceptance criteria;
- expected unit tests;
- expected integration/e2e tests when relevant;
- realtime impact;
- timezone impact;
- feature flag requirement when relevant;
- privacy and observability impact;
- implementation checklist reference:
  `Use ADR/slotly/feature-checklist.md before opening the PR.`

Each pull request should include the practical checklist:

- ADR/ticket still accurate;
- domain logic tested;
- server validation added when relevant;
- timezone conversion considered;
- realtime behavior considered;
- feature flag considered;
- e2e added or intentionally skipped.

## P0 - Project Foundation

Objective: clean Next.js base, testable and deployable.

Tickets:

- Bootstrap Next.js + TypeScript strict + pnpm.
- Add Tailwind + shadcn/ui.
- Add Supabase client setup.
- Add lint/typecheck/format scripts.
- Add Vitest for domain/services.
- Add Playwright for e2e.
- Add project structure: `src/domain`, `src/server`, `src/features`, `src/app`.
- Add `APP_ACCESS_MODE`.
- Add minimal CI: typecheck, lint, unit tests.

Tests:

- unit: env/access mode parsing.
- e2e: `/` accessible.
- e2e: `/new` reachable in public mode.

## P1 - Availability Domain

Objective: product rules without UI or DB coupling.

Tickets:

- Define core entities and vocabulary in ADR.
- Model events, participants, availability windows, and candidate slots.
- Generate valid meeting windows from availability, duration, and grid resolution.
- Calculate `availableCount`, `availableParticipants`, and `missingParticipants`.
- Sort best slots by highest attendance.
- Normalize timezone-aware inputs into stable instants.

Tests:

- event creation validation.
- valid slot generation.
- participant availability coverage.
- ranking by attendance.
- timezone conversion edge cases.

## P2 - Create Poll

Objective: create an availability poll in under 15 seconds.

Tickets:

- Landing CTA to create poll.
- `/new` form with event name, date range, duration, and grid resolution.
- Supabase persistence for event.
- Redirect to `/e/{eventId}` after creation.
- Mobile-first validation and error states.

Tests:

- unit: create event validation.
- integration: create event persists expected fields.
- e2e: create poll happy path.
- e2e: invalid date range and missing title.

## P3 - Join Poll

Objective: fill availability in under 30 seconds.

Tickets:

- `/e/[id]` event page.
- Participant name entry with no account.
- Automatic timezone detection.
- Mobile-first availability grid.
- Tap, drag, and continuous selection.
- Save availability.
- Empty, loading, error, and not-found states.

Tests:

- unit: availability window normalization.
- integration: participant + availability persistence.
- e2e: join poll and select availability on desktop.
- e2e: mobile touch selection smoke test.

## P4 - Results & Ranking

Objective: identify the best meeting slot in under 5 seconds.

Tickets:

- `/e/[id]/results` page.
- Best slots ranking sorted by attendance.
- Present/absent detail for selected slot.
- Heatmap intensity by participant count.
- Keep availability grid visible beside or below ranking.
- Empty state before participants respond.

Tests:

- unit: results ranking.
- unit: present/absent classification.
- e2e: results page shows best slot.
- e2e: selected slot shows present and absent lists.

## P5 - Realtime & Polish

Objective: make shared poll updates feel live and modern.

Tickets:

- Supabase Realtime subscription for participants and availability.
- Results recalculation after live updates.
- Mobile layout polish.
- Copy pass: no instructions required for core flow.
- Share link affordance.

Tests:

- integration: realtime subscription helpers.
- e2e: two-page update smoke test if feasible.
- visual/mobile smoke tests for create, poll, results.

## P6 - Observability & Hardening

Objective: production feedback loops without leaking sensitive data.

Tickets:

- Structured logs.
- Error reporting.
- Product analytics events.
- Privacy masking rules.
- Rate limiting and abuse protections.
- Backup/export policy if relevant.

Tests:

- unit: safe payload helpers.
- integration: expected logs/events emitted.
- e2e: sensitive routes do not expose private data.

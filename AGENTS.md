# slotly - Codex Guide

## Source Of Truth

Canonical product and architecture decisions live in `ADR/`.

- Product hub: `ADR/slotly.md`
- UX decisions: `ADR/slotly-ux.md`
- Domain ADRs: `ADR/slotly/`
- Feature checklist: `ADR/slotly/feature-checklist.md`

Before implementing a feature, read the relevant ADR and apply the feature checklist.

## Stack Direction

The expected rebuild target is:

- Next.js + React
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase database + realtime
- Supabase Row Level Security
- Vercel deployment
- no authentication for the MVP

These choices are canonical draft decisions until the architecture ADR is reviewed.

## Working Rules

- Use `pnpm`.
- Write source code, route segments, variables, functions, classes, and files in English.
- Keep user-facing copy out of components when an i18n layer exists.
- Keep domain logic framework-agnostic where practical.
- Keep the MVP accountless: no onboarding, no login, no team management.
- Optimize for mobile-first participation and result readability.
- Admin/debug tools, if introduced later, must call the same domain services as normal user flows, with explicit bypass context.
- Every user-facing feature must consider tests, realtime behavior, timezone handling, observability, and privacy.

## Planning Gate

Before fixing a bug or implementing a new feature, do not jump directly into code.

Required flow:

1. Discuss the problem or feature with the user.
2. Clarify expected behavior, scope, constraints, and tradeoffs.
3. Create or update a GitHub issue when the work is non-trivial or should be traceable.
4. Let the user choose or confirm the next task before implementation starts.

Small read-only investigations are allowed before this gate, but code changes, bug fixes, feature work, schema changes, and ADR changes require user confirmation of the task direction first.

When planning an implementation, account for near-term known developments. Do not over-architect speculative abstractions, but if the roadmap already implies repeated public pages, shared validation, common layouts, reusable scheduling flows, timezone utilities, or realtime subscriptions, choose a structure that supports that known direction from the start.

## ADR Maintenance

When a durable decision changes, update the ADR first or in the same commit as the implementation.

Prefer small focused ADR updates over scattered notes. ADRs are the source of truth; implementation should not invent product rules that are absent from them.

## Commits

Use short conventional commit messages. Split large work into reviewable commits:

- one cleanup/bootstrap commit;
- one feature foundation commit;
- one commit per coherent feature or migration.

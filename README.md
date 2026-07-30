# Slotly

**Find the best time or date to meet, without accounts or spreadsheets.**

Slotly is a lightweight availability poll built for quick plans: meetings,
dinners, weekends with friends, family events, and any moment where asking
"when are you free?" should not become project management.

[Try Slotly](https://slotly-meetings.vercel.app)

## What It Does

Slotly lets anyone create a poll, share a link, and collect availability from
participants in a few seconds.

- **No accounts**: organizers and participants can use it immediately.
- **One link**: create a poll and share it anywhere.
- **Mobile-first selection**: tap or drag across the slots that work.
- **Time-slot polls**: find the best meeting time across several days.
- **Full-day polls**: pick whole dates for weekends, trips, and date-only plans.
- **Instant results**: Slotly ranks the best options automatically.
- **Timezone-aware**: time-slot polls stay readable across locations.
- **Bilingual interface**: English and French, detected from the browser.

## Why It Exists

Most scheduling products are either too formal, too account-heavy, or awkward on
phones. Slotly is intentionally small: no onboarding, no team setup, no calendar
integration required before you can get an answer.

The goal is simple:

> Create a poll. Share the link. See the best option.

## Product Principles

- **Fast over complete**: the first useful answer matters more than a huge
  feature set.
- **Accountless by default**: joining a poll should feel as easy as replying to
  a message.
- **Mobile-first**: the participant flow is the product.
- **Privacy-conscious**: collect only what the poll needs.
- **Readable results**: the best option should be obvious in a few seconds.

## Current Scope

Slotly currently supports:

- public availability polls;
- participant name-based reconnect;
- automatic best-slot ranking;
- realtime refresh when availability changes;
- stale poll cleanup;
- optional privacy-first product analytics.

Slotly does not currently include:

- accounts;
- calendars integrations;
- email notifications;
- recurring polls;
- team workspaces.

Those may come later, but the core free flow should stay fast and accountless.

## Privacy And Safety

Slotly polls are public to anyone with the link. The link acts as the share
token.

Current safeguards include:

- non-enumerable poll ids;
- server-side validation and rate limiting on public actions;
- restricted direct database access;
- no raw event titles or participant names in analytics payloads;
- automatic cleanup for stale polls.

## Roadmap Ideas

- Better result sharing.
- Calendar export.
- Optional organizer controls.
- Stronger abuse protection if traffic grows.
- More polished full-day planning flows.

## Status

Slotly is a public MVP. It is actively evolving based on real usage and
feedback.

Feedback and bug reports are welcome:
[creadiv.tech+slotlysupport@gmail.com](mailto:creadiv.tech+slotlysupport@gmail.com)

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import { messages, type Locale } from "@/i18n/messages";
import {
  cancelEventFinalizationAction,
  type FinalizationActionState,
} from "./actions";
import { broadcastEventChange } from "./event-realtime";
import { TemporaryStatusMessage } from "./temporary-status-message";

const initialFinalizationState: FinalizationActionState = {
  status: "idle",
  errors: [],
};

interface FinalEventCardProps {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly finalStart: string;
  readonly finalEnd: string;
  readonly isCreator: boolean;
  readonly isFullDay: boolean;
  readonly locale: Locale;
}

export function FinalEventCard({
  eventId,
  eventTitle,
  finalEnd,
  finalStart,
  isCreator,
  isFullDay,
  locale,
}: FinalEventCardProps) {
  const router = useRouter();
  const t = messages[locale].results;
  const [state, formAction, isPending] = useActionState(
    cancelEventFinalizationAction,
    initialFinalizationState,
  );
  const timezone = useBrowserTimeZone(isFullDay);
  const formattedSlot = formatFinalSlot(
    finalStart,
    finalEnd,
    timezone,
    locale,
    {
      isFullDay,
    },
  );
  const calendarLinks = useMemo(
    () =>
      buildCalendarLinks({
        eventTitle,
        finalEnd,
        finalStart,
        isFullDay,
      }),
    [eventTitle, finalEnd, finalStart, isFullDay],
  );

  useEffect(() => {
    if (state.status === "success") {
      void broadcastEventChange(eventId, "event_reopened");
      router.refresh();
    }
  }, [eventId, router, state.status, state.statusId]);

  return (
    <section className="sl-panel mt-8 p-5 sm:p-6">
      {state.status === "success" ? (
        <TemporaryStatusMessage key={state.statusId}>
          {t.finalizationCanceled}
        </TemporaryStatusMessage>
      ) : null}

      {state.status === "error" ? (
        <div className="sl-alert sl-alert-error mb-4" role="alert">
          <ul className="space-y-1">
            {state.errors.map((error) => (
              <li key={error}>
                {t.finalizationErrors[
                  error as keyof typeof t.finalizationErrors
                ] ?? messages[locale].common.fallbackError}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm font-semibold text-[var(--primary)]">
        {t.finalizedTitle}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal">
        {formattedSlot}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {t.finalizedDescription}
      </p>
      {!isFullDay ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t.displayedIn(timezone)}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <a
          className="sl-button sl-button-primary"
          href={calendarLinks.google}
          rel="noreferrer"
          target="_blank"
        >
          {t.addToGoogleCalendar}
        </a>
        <a
          className="sl-button sl-button-secondary"
          download={`${sanitizeFilename(eventTitle)}.ics`}
          href={calendarLinks.ics}
        >
          {t.addToIcloudCalendar}
        </a>
      </div>

      {isCreator ? (
        <form
          action={formAction}
          className="mt-4"
          onSubmit={(event) => {
            if (!window.confirm(t.cancelFinalDateConfirm)) {
              event.preventDefault();
            }
          }}
        >
          <input name="eventId" type="hidden" value={eventId} />
          <button
            className="sl-button sl-button-secondary w-full sm:w-auto"
            disabled={isPending}
            type="submit"
          >
            {isPending ? t.cancelingFinalDate : t.cancelFinalDate}
          </button>
        </form>
      ) : null}
    </section>
  );
}

function useBrowserTimeZone(isFullDay: boolean): string {
  return useMemo(
    () =>
      isFullDay
        ? "UTC"
        : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [isFullDay],
  );
}

export function formatFinalSlot(
  finalStart: string,
  finalEnd: string,
  timezone: string,
  locale: Locale,
  options: { readonly isFullDay: boolean },
): string {
  const start = new Date(finalStart);

  if (options.isFullDay) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeZone: "UTC",
    }).format(start);
  }

  const end = new Date(finalEnd);
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(start);
  const timeFormat = new Intl.DateTimeFormat(locale, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });

  return `${day}, ${timeFormat.format(start)} -> ${timeFormat.format(end)}`;
}

function buildCalendarLinks({
  eventTitle,
  finalEnd,
  finalStart,
  isFullDay,
}: {
  readonly eventTitle: string;
  readonly finalStart: string;
  readonly finalEnd: string;
  readonly isFullDay: boolean;
}): { readonly google: string; readonly ics: string } {
  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", eventTitle);
  google.searchParams.set(
    "dates",
    isFullDay
      ? `${formatGoogleDateOnly(finalStart)}/${formatGoogleDateOnly(finalEnd)}`
      : `${formatGoogleDateTime(finalStart)}/${formatGoogleDateTime(finalEnd)}`,
  );

  return {
    google: google.toString(),
    ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(
      buildIcs({ eventTitle, finalEnd, finalStart, isFullDay }),
    )}`,
  };
}

function buildIcs({
  eventTitle,
  finalEnd,
  finalStart,
  isFullDay,
}: {
  readonly eventTitle: string;
  readonly finalStart: string;
  readonly finalEnd: string;
  readonly isFullDay: boolean;
}): string {
  const now = formatGoogleDateTime(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Slotly//Availability Poll//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@slotly`,
    `DTSTAMP:${now}`,
    isFullDay
      ? `DTSTART;VALUE=DATE:${formatGoogleDateOnly(finalStart)}`
      : `DTSTART:${formatGoogleDateTime(finalStart)}`,
    isFullDay
      ? `DTEND;VALUE=DATE:${formatGoogleDateOnly(finalEnd)}`
      : `DTEND:${formatGoogleDateTime(finalEnd)}`,
    `SUMMARY:${escapeIcs(eventTitle)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

function formatGoogleDateTime(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function formatGoogleDateOnly(value: string): string {
  return new Date(value).toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function sanitizeFilename(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "slotly-event"
  );
}

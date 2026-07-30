"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/analytics/client";
import { getDeviceType, resolveRoutePattern } from "@/analytics/events";
import { messages, type Locale } from "@/i18n/messages";
import type { EventAvailabilityWindow } from "@/server/events";
import { saveAvailabilityAction } from "./actions";
import { broadcastEventChange } from "./event-realtime";
import { TemporaryStatusMessage } from "./temporary-status-message";

interface FullDayAvailabilitySelectorProps {
  readonly eventId: string;
  readonly initialWindows?: readonly EventAvailabilityWindow[];
  readonly participantId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly locale: Locale;
}

interface CalendarDay {
  readonly id: string;
  readonly label: string;
  readonly weekdayLabel: string;
  readonly start: string;
  readonly end: string;
  readonly selectable: boolean;
}

const initialSaveAvailabilityState = {
  status: "idle" as const,
  errors: [] as readonly string[],
};

export function FullDayAvailabilitySelector({
  eventId,
  initialWindows = [],
  participantId,
  startDate,
  endDate,
  locale,
}: FullDayAvailabilitySelectorProps) {
  const t = messages[locale];
  const days = useMemo(
    () => buildCalendarDays(startDate, endDate, locale),
    [endDate, locale, startDate],
  );
  const selectableDays = useMemo(
    () => days.filter((day) => day.selectable),
    [days],
  );
  const initialSelectedIds = useMemo(
    () => buildSelectedIds(selectableDays, initialWindows),
    [initialWindows, selectableDays],
  );
  const [savedSelectedIds, setSavedSelectedIds] =
    useState<ReadonlySet<string>>(initialSelectedIds);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => initialSelectedIds,
  );
  const [state, formAction, isPending] = useActionState(
    saveAvailabilityAction,
    initialSaveAvailabilityState,
  );
  const handledSuccessState = useRef<typeof state | null>(null);
  const hasTrackedAvailabilityStart = useRef(false);
  const isDirty = !areSetsEqual(selectedIds, savedSelectedIds);
  const selectedWindows = selectableDays
    .filter((day) => selectedIds.has(day.id))
    .map((day) => ({ start: day.start, end: day.end }));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedSelectedIds(initialSelectedIds);
      setSelectedIds(initialSelectedIds);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialSelectedIds]);

  useEffect(() => {
    if (state.status !== "success" || handledSuccessState.current === state) {
      return;
    }

    handledSuccessState.current = state;
    const savedIds = selectedIds;
    trackEvent({
      name: "availability.saved",
      properties: {
        days_count: selectableDays.length,
        device_type: getDeviceType(window.innerWidth),
        locale,
        mode: "full_day",
        route_pattern: resolveRoutePattern(window.location.pathname),
        selected_slots_count: selectedIds.size,
        slot_size_minutes: 1440,
      },
    });
    const timeoutId = window.setTimeout(() => {
      setSavedSelectedIds(savedIds);
    }, 0);
    void broadcastEventChange(eventId, "availability_saved");

    return () => window.clearTimeout(timeoutId);
  }, [eventId, locale, selectableDays.length, selectedIds, state]);

  function toggleDay(dayId: string) {
    trackAvailabilityStart();
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }

      return next;
    });
  }

  function clearAll() {
    trackAvailabilityStart();
    setSelectedIds(new Set());
  }

  function cancelChanges() {
    setSelectedIds(savedSelectedIds);
  }

  function trackAvailabilityStart() {
    if (hasTrackedAvailabilityStart.current) {
      return;
    }

    hasTrackedAvailabilityStart.current = true;
    trackEvent({
      name: "availability.started",
      properties: {
        days_count: selectableDays.length,
        device_type: getDeviceType(window.innerWidth),
        locale,
        mode: "full_day",
        route_pattern: resolveRoutePattern(window.location.pathname),
        slot_size_minutes: 1440,
      },
    });
  }

  return (
    <form
      action={formAction}
      className={`flex flex-col gap-4 ${isDirty || isPending ? "pb-20 sm:pb-0" : ""}`}
    >
      <input name="eventId" type="hidden" value={eventId} />
      <input name="participantId" type="hidden" value={participantId} />
      <input
        name="windows"
        type="hidden"
        value={JSON.stringify(selectedWindows)}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t.event.availability.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t.event.availability.fullDayHelp}
          </p>
        </div>
        <span className="text-sm font-medium text-[var(--primary)]">
          {t.event.availability.selected(selectedIds.size, isDirty)}
        </span>
      </div>

      {state.status === "error" ? (
        <div className="sl-alert sl-alert-error" role="alert">
          <ul className="space-y-1">
            {state.errors.map((error) => (
              <li key={error}>
                {t.event.availability.errors[
                  error as keyof typeof t.event.availability.errors
                ] ?? t.common.fallbackError}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.status === "success" ? (
        <TemporaryStatusMessage key={state.statusId}>
          {t.event.availability.saved}
        </TemporaryStatusMessage>
      ) : null}

      <div className="grid grid-cols-7 gap-1.5">
        {getWeekdayLabels(locale).map((label) => (
          <div
            className="pb-1 text-center text-xs font-semibold text-[var(--muted)]"
            key={label}
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const selected = selectedIds.has(day.id);

          return (
            <button
              aria-label={day.weekdayLabel}
              aria-pressed={selected}
              className={`min-h-14 rounded-[var(--radius-panel)] border px-1.5 py-2 text-center text-sm font-medium transition ${
                day.selectable
                  ? selected
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)]"
                  : "border-[var(--line-soft)] bg-[var(--surface-subtle)] text-[var(--muted)] opacity-45"
              }`}
              disabled={!day.selectable}
              key={day.id}
              onClick={() => toggleDay(day.id)}
              type="button"
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {selectedIds.size > 0 ? (
        <button
          className="sl-button sl-button-secondary min-h-9 w-full text-xs sm:w-1/2"
          disabled={isPending}
          onClick={clearAll}
          type="button"
        >
          {t.event.availability.clearAll}
        </button>
      ) : null}

      {isDirty || isPending ? (
        <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-30 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:right-[max(1rem,calc((100vw-56rem)/2))] sm:left-auto sm:flex sm:justify-end">
          <button
            className="sl-button sl-button-secondary pointer-events-auto min-w-0 whitespace-nowrap px-2 py-3 text-xs shadow-[var(--shadow-floating)] sm:w-auto sm:px-5 sm:text-sm sm:shadow-none"
            disabled={isPending || !isDirty}
            onClick={cancelChanges}
            type="button"
          >
            <span className="sm:hidden">
              {t.event.availability.cancelChangesShort}
            </span>
            <span className="hidden sm:inline">
              {t.event.availability.cancelChanges}
            </span>
          </button>
          <button
            className="sl-button sl-button-primary pointer-events-auto min-w-0 whitespace-nowrap px-2 py-3 text-xs shadow-[var(--shadow-floating)] sm:w-auto sm:px-5 sm:text-sm sm:shadow-none"
            disabled={isPending || !isDirty}
            type="submit"
          >
            <span className="sm:hidden">
              {isPending
                ? t.event.availability.savingShort
                : t.event.availability.saveShort}
            </span>
            <span className="hidden sm:inline">
              {isPending
                ? t.event.availability.saving
                : t.event.availability.save}
            </span>
          </button>
        </div>
      ) : null}
    </form>
  );
}

function buildCalendarDays(
  startDate: string,
  endDate: string,
  locale: Locale,
): CalendarDay[] {
  const startMs = toDateOnlyMs(startDate);
  const endMs = toDateOnlyMs(endDate);
  const firstCalendarMs = startMs - getUtcWeekdayIndex(startMs) * dayMs;
  const lastCalendarMs = endMs + (6 - getUtcWeekdayIndex(endMs)) * dayMs;
  const days: CalendarDay[] = [];

  for (
    let dayStartMs = firstCalendarMs;
    dayStartMs <= lastCalendarMs;
    dayStartMs += dayMs
  ) {
    const selectable = dayStartMs >= startMs && dayStartMs <= endMs;
    const date = new Date(dayStartMs);

    days.push({
      id: toDateId(dayStartMs),
      label: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
      weekdayLabel: new Intl.DateTimeFormat(locale, {
        dateStyle: "full",
        timeZone: "UTC",
      }).format(date),
      start: new Date(dayStartMs).toISOString(),
      end: new Date(dayStartMs + dayMs).toISOString(),
      selectable,
    });
  }

  return days;
}

function buildSelectedIds(
  days: readonly CalendarDay[],
  windows: readonly EventAvailabilityWindow[],
): ReadonlySet<string> {
  const selectedIds = new Set<string>();

  for (const day of days) {
    const dayStartMs = Date.parse(day.start);
    const dayEndMs = Date.parse(day.end);

    if (
      windows.some(
        (window) =>
          Date.parse(window.start) <= dayStartMs &&
          Date.parse(window.end) >= dayEndMs,
      )
    ) {
      selectedIds.add(day.id);
    }
  }

  return selectedIds;
}

function getWeekdayLabels(locale: Locale): string[] {
  const monday = Date.parse("2026-07-27T00:00:00.000Z");

  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(monday + index * dayMs)),
  );
}

function getUtcWeekdayIndex(valueMs: number): number {
  return (new Date(valueMs).getUTCDay() + 6) % 7;
}

function toDateId(valueMs: number): string {
  return new Date(valueMs).toISOString().slice(0, 10);
}

function toDateOnlyMs(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

function areSetsEqual<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

const dayMs = 24 * 60 * 60 * 1000;

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { RankedSlot } from "@/domain/availability";
import { messages, type Locale } from "@/i18n/messages";
import { finalizeEventAction, type FinalizationActionState } from "../actions";
import { broadcastEventChange } from "../event-realtime";
import { TemporaryStatusMessage } from "../temporary-status-message";

interface ResultsContentProps {
  readonly canFinalize: boolean;
  readonly eventId: string;
  readonly isFullDay: boolean;
  readonly locale: Locale;
  readonly participantCount: number;
  readonly rankedSlots: readonly RankedSlot[];
}

const initialFinalizationState: FinalizationActionState = {
  status: "idle",
  errors: [],
};

export function ResultsContent({
  canFinalize,
  eventId,
  isFullDay,
  locale,
  participantCount,
  rankedSlots,
}: ResultsContentProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [state, formAction, isPending] = useActionState(
    finalizeEventAction,
    initialFinalizationState,
  );
  const selectedSlot = rankedSlots[selectedIndex];
  const rankedSlotsToShow = rankedSlots.slice(0, 10);
  const maxAvailableCount = rankedSlots[0]?.availableCount ?? 0;
  const timezone = useBrowserTimeZone();
  const t = messages[locale].results;

  useEffect(() => {
    if (state.status === "success") {
      void broadcastEventChange(eventId, "event_finalized");
      router.refresh();
    }
  }, [eventId, router, state.status, state.statusId]);

  if (rankedSlotsToShow.length === 0) {
    return (
      <div className="mt-8 grid gap-5 lg:grid-cols-[22rem_1fr]">
        <EmptyState
          description={
            participantCount === 0
              ? t.emptyNoParticipantsDescription
              : t.emptyNoAvailabilityDescription
          }
          title={
            participantCount === 0
              ? t.emptyNoParticipantsTitle
              : t.emptyNoAvailabilityTitle
          }
        />
        <section className="sl-panel p-5">
          <EmptyState
            description={t.nothingToRankDescription}
            title={t.nothingToRankTitle}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[22rem_1fr]">
      <section className="space-y-3">
        {rankedSlotsToShow.map((slot, index) => {
          const selected = index === selectedIndex;

          return (
            <button
              aria-pressed={selected}
              className="sl-panel w-full p-4 text-left active:scale-[0.99]"
              data-selected={selected}
              key={`${slot.start}-${slot.end}`}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <span className="text-sm font-semibold text-[var(--primary)]">
                    #{index + 1}
                  </span>
                  <p className="mt-1 font-medium">
                    {formatSlot(slot, timezone, locale, isFullDay)}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-[var(--muted)]">
                  {t.availableCount(slot.availableCount)}
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[var(--line-soft)]">
                <div
                  className="h-2 rounded-full bg-[var(--primary)]"
                  style={{
                    width: `${toPercentage(slot.availableCount, maxAvailableCount)}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </section>

      <section className="sl-panel p-5">
        {state.status === "success" ? (
          <TemporaryStatusMessage key={state.statusId}>
            {t.finalizationSaved}
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

        {selectedSlot ? (
          <>
            <p className="text-sm font-semibold text-[var(--primary)]">
              {t.selectedRecommendation}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {formatSlot(selectedSlot, timezone, locale, isFullDay)}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t.attendance(selectedSlot.availableCount, participantCount)}
            </p>
            {!isFullDay ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t.displayedIn(timezone)}
              </p>
            ) : null}
            {canFinalize ? (
              <form
                action={formAction}
                className="mt-5 border-t border-[var(--line)] pt-5"
                onSubmit={(event) => {
                  if (!window.confirm(t.finalizeConfirm)) {
                    event.preventDefault();
                  }
                }}
              >
                <p className="text-sm font-semibold text-[var(--primary)]">
                  {t.creatorActionsTitle}
                </p>
                <input name="eventId" type="hidden" value={eventId} />
                <input
                  name="finalStart"
                  type="hidden"
                  value={selectedSlot.start}
                />
                <input name="finalEnd" type="hidden" value={selectedSlot.end} />
                <button
                  className="sl-button sl-button-primary mt-3 w-full sm:w-auto"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? t.finalizing : t.finalizeSelected}
                </button>
              </form>
            ) : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ParticipantList
                names={selectedSlot.availableParticipants.map(
                  (participant) => participant.name,
                )}
                noOne={t.noOne}
                title={t.available}
              />
              <ParticipantList
                names={selectedSlot.missingParticipants.map(
                  (participant) => participant.name,
                )}
                noOne={t.noOne}
                title={t.missing}
              />
            </div>
          </>
        ) : (
          <EmptyState
            description={t.nothingToRankDescription}
            title={t.nothingToRankTitle}
          />
        )}
      </section>
    </div>
  );
}

function ParticipantList({
  names,
  noOne,
  title,
}: {
  readonly names: readonly string[];
  readonly noOne: string;
  readonly title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--primary)]">{title}</h3>
      {names.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          {names.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">{noOne}</p>
      )}
    </div>
  );
}

function EmptyState({
  description,
  title,
}: {
  readonly description: string;
  readonly title: string;
}) {
  return (
    <div className="sl-panel border-dashed p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

function useBrowserTimeZone(): string {
  return useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
}

function formatSlot(
  slot: RankedSlot,
  timezone: string,
  locale: Locale,
  isFullDay: boolean,
): string {
  const start = new Date(slot.start);

  if (isFullDay) {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(start);
  }

  const end = new Date(slot.end);
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

function toPercentage(count: number, max: number): number {
  if (max === 0) {
    return 0;
  }

  return Math.max(8, Math.round((count / max) * 100));
}

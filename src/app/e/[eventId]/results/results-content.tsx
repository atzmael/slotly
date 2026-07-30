"use client";

import { useMemo, useState } from "react";
import type { RankedSlot } from "@/domain/availability";
import { messages, type Locale } from "@/i18n/messages";

interface ResultsContentProps {
  readonly locale: Locale;
  readonly participantCount: number;
  readonly rankedSlots: readonly RankedSlot[];
}

export function ResultsContent({
  locale,
  participantCount,
  rankedSlots,
}: ResultsContentProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSlot = rankedSlots[selectedIndex];
  const rankedSlotsToShow = rankedSlots.slice(0, 10);
  const maxAvailableCount = rankedSlots[0]?.availableCount ?? 0;
  const timezone = useBrowserTimeZone();
  const t = messages[locale].results;

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
                    {formatSlot(slot, timezone, locale)}
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
        {selectedSlot ? (
          <>
            <p className="text-sm font-semibold text-[var(--primary)]">
              {t.selectedRecommendation}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {formatSlot(selectedSlot, timezone, locale)}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t.attendance(selectedSlot.availableCount, participantCount)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {t.displayedIn(timezone)}
            </p>
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
): string {
  const start = new Date(slot.start);
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

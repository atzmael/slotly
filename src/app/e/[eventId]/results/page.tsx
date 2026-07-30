import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  rankAvailabilitySlots,
  rankFullDayAvailabilitySlots,
} from "@/domain/availability";
import { getRequestLocale } from "@/i18n/locale";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { messages, type Locale } from "@/i18n/messages";
import { getEventSnapshot } from "@/server/events";
import { BrandMark } from "../../../brand-mark";
import { createPageMetadata } from "../../../site-metadata";
import { EventRealtimeRefresh } from "../event-realtime";
import { ShareLinkButton } from "../share-link-button";
import { ResultsContent } from "./results-content";

interface ResultsPageProps {
  readonly params: Promise<{
    readonly eventId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ResultsPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const locale = await getRequestLocale();
  const t = messages[locale].meta;
  const result = await getEventSnapshot(eventId);
  const title = result.ok
    ? result.snapshot.event.isFullDay
      ? t.fullDayResultsTitle(result.snapshot.event.title)
      : t.resultsTitle(result.snapshot.event.title)
    : t.unavailableEventTitle;

  return createPageMetadata({
    locale,
    title,
    description: t.resultsDescription,
    path: `/e/${eventId}/results`,
    noIndex: true,
  });
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = await params;
  const locale = await getRequestLocale();
  const t = messages[locale];
  const result = await getEventSnapshot(eventId);

  if (!result.ok) {
    notFound();
  }

  const { event, participants, availabilityWindows } = result.snapshot;
  const rankInput = {
    participants: participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      timezone: participant.timezone,
    })),
    availability: availabilityWindows.map((window) => ({
      participantId: window.participantId,
      start: window.start,
      end: window.end,
    })),
  };
  const rankedSlots = event.isFullDay
    ? rankFullDayAvailabilitySlots({
        ...rankInput,
        startDate: event.startDate,
        endDate: event.endDate,
      })
    : rankAvailabilitySlots({
        ...rankInput,
        durationMinutes: event.durationMinutes,
        slotSizeMinutes: event.slotSizeMinutes,
      });

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <EventRealtimeRefresh eventId={event.id} />
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="text-sm font-semibold text-[var(--primary)]"
            href="/"
          >
            <BrandMark size="sm" />
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              {formatEventWindow(
                event.startDate,
                event.endDate,
                event.startTime,
                event.endTime,
                event.isFullDay,
                locale,
              )}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              {event.isFullDay
                ? t.results.fullDayTitle(event.title)
                : t.results.title(event.title)}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t.event.participantCount(participants.length)}
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-40">
            <Link
              className="sl-button sl-button-secondary"
              href={`/e/${event.id}`}
            >
              {t.event.addAvailability}
            </Link>
            <ShareLinkButton
              locale={locale}
              path={`/e/${event.id}`}
              source="results"
            />
          </div>
        </div>

        <ResultsContent
          locale={locale}
          isFullDay={event.isFullDay}
          participantCount={participants.length}
          rankedSlots={rankedSlots}
        />
      </section>
    </main>
  );
}

function formatEventWindow(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  isFullDay: boolean,
  locale: Locale,
): string {
  if (isFullDay) {
    return `${formatDate(startDate, locale)} -> ${formatDate(endDate, locale)}`;
  }

  return `${formatDate(startDate, locale)} -> ${formatDate(endDate, locale)}, ${startTime} -> ${endTime}`;
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

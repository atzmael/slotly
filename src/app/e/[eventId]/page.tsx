import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequestLocale } from "@/i18n/locale";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { messages, type Locale } from "@/i18n/messages";
import { getEventSnapshot } from "@/server/events";
import { BrandMark } from "../../brand-mark";
import { EventRealtimeRefresh } from "./event-realtime";
import { JoinEventForm } from "./join-event-form";
import { ShareLinkButton } from "./share-link-button";

interface EventPageProps {
  readonly params: Promise<{
    readonly eventId: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const locale = await getRequestLocale();
  const t = messages[locale];
  const result = await getEventSnapshot(eventId);

  if (!result.ok) {
    notFound();
  }

  const { event, participants, availabilityWindows } = result.snapshot;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <EventRealtimeRefresh eventId={event.id} />
      <section className="mx-auto w-full max-w-4xl">
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
              {event.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t.event.participantCount(participants.length)}
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-40">
            <Link
              className="sl-button sl-button-secondary"
              href={`/e/${eventId}/results`}
            >
              {t.event.viewResults}
            </Link>
            <ShareLinkButton
              locale={locale}
              path={`/e/${event.id}`}
              source="event"
            />
          </div>
        </div>

        <div className="sl-panel mt-8 p-5">
          <JoinEventForm
            availabilityWindows={availabilityWindows}
            endDate={event.endDate}
            endTime={event.endTime}
            eventId={event.id}
            isFullDay={event.isFullDay}
            locale={locale}
            participants={participants}
            slotSizeMinutes={event.slotSizeMinutes}
            startDate={event.startDate}
            startTime={event.startTime}
          />
        </div>
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

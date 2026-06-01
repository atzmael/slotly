import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventSnapshot } from "@/server/events";
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
  const result = await getEventSnapshot(eventId);

  if (!result.ok) {
    notFound();
  }

  const { event, participants } = result.snapshot;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <EventRealtimeRefresh eventId={event.id} />
      <section className="mx-auto w-full max-w-4xl">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          Slotly
        </Link>
        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              {formatDate(event.startDate)} {"->"} {formatDate(event.endDate)}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              {event.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {participants.length} participant
              {participants.length === 1 ? "" : "s"} joined
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-40">
            <Link
              className="rounded-full border border-[var(--line)] px-4 py-2 text-center text-sm font-medium"
              href={`/e/${eventId}/results`}
            >
              View results
            </Link>
            <ShareLinkButton path={`/e/${event.id}`} />
          </div>
        </div>

        <div className="mt-8 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
          <JoinEventForm
            endDate={event.endDate}
            eventId={event.id}
            startDate={event.startDate}
          />
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

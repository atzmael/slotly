import Link from "next/link";
import { notFound } from "next/navigation";
import { rankAvailabilitySlots } from "@/domain/availability";
import { getEventSnapshot } from "@/server/events";
import { ResultsContent } from "./results-content";

interface ResultsPageProps {
  readonly params: Promise<{
    readonly eventId: string;
  }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = await params;
  const result = await getEventSnapshot(eventId);

  if (!result.ok) {
    notFound();
  }

  const { event, participants, availabilityWindows } = result.snapshot;
  const rankedSlots = rankAvailabilitySlots({
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
    durationMinutes: event.durationMinutes,
    slotSizeMinutes: event.slotSizeMinutes,
  });

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          Slotly
        </Link>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              {formatDate(event.startDate)} {"->"} {formatDate(event.endDate)}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">
              Best times for {event.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {participants.length} participant
              {participants.length === 1 ? "" : "s"} joined
            </p>
          </div>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-center text-sm font-medium"
            href={`/e/${event.id}`}
          >
            Add availability
          </Link>
        </div>

        <ResultsContent
          participantCount={participants.length}
          rankedSlots={rankedSlots}
        />
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

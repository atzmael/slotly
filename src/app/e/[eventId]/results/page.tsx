import Link from "next/link";
import { notFound } from "next/navigation";
import {
  rankAvailabilitySlots,
  type RankedSlot,
} from "@/domain/availability";
import { getEventSnapshot } from "@/server/events";

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
  const selectedSlot = rankedSlots[0];
  const rankedSlotsToShow = rankedSlots.slice(0, 10);
  const maxAvailableCount = rankedSlots[0]?.availableCount ?? 0;

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

        <div className="mt-8 grid gap-5 lg:grid-cols-[22rem_1fr]">
          <section className="space-y-3">
            {rankedSlotsToShow.length > 0 ? (
              rankedSlotsToShow.map((slot, index) => (
                <article
                  className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4"
                  key={`${slot.start}-${slot.end}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-sm font-semibold text-[var(--primary)]">
                        #{index + 1}
                      </span>
                      <p className="mt-1 font-medium">{formatSlot(slot)}</p>
                    </div>
                    <span className="text-sm text-[var(--muted)]">
                      {slot.availableCount} available
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-[var(--line)]">
                    <div
                      className="h-2 rounded-full bg-[var(--primary)]"
                      style={{
                        width: `${toPercentage(slot.availableCount, maxAvailableCount)}%`,
                      }}
                    />
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title={
                  participants.length === 0
                    ? "No one has joined yet"
                    : "No availability yet"
                }
                description={
                  participants.length === 0
                    ? "Share the event link so people can add their name and slots."
                    : "Ask participants to add availability, then the best times will appear here."
                }
              />
            )}
          </section>

          <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
            {selectedSlot ? (
              <>
                <p className="text-sm font-semibold text-[var(--primary)]">
                  Top recommendation
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  {formatSlot(selectedSlot)}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {selectedSlot.availableCount} of {participants.length}{" "}
                  participant
                  {participants.length === 1 ? "" : "s"} can attend.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <ParticipantList
                    names={selectedSlot.availableParticipants.map(
                      (participant) => participant.name,
                    )}
                    title="Available"
                  />
                  <ParticipantList
                    names={selectedSlot.missingParticipants.map(
                      (participant) => participant.name,
                    )}
                    title="Missing"
                  />
                </div>
              </>
            ) : (
              <EmptyState
                title="Nothing to rank yet"
                description="Results are calculated as soon as at least one participant saves availability."
              />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ParticipantList({
  names,
  title,
}: {
  readonly names: readonly string[];
  readonly title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--primary)]">{title}</h3>
      {names.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">No one</p>
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
    <div className="rounded-[8px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatSlot(slot: RankedSlot): string {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const day = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const timeFormat = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return `${day}, ${timeFormat.format(start)} -> ${timeFormat.format(end)} UTC`;
}

function toPercentage(count: number, max: number): number {
  if (max === 0) {
    return 0;
  }

  return Math.max(8, Math.round((count / max) * 100));
}

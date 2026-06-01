import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventSnapshot } from "@/server/events";
import { JoinEventForm } from "./join-event-form";

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
      <section className="mx-auto w-full max-w-4xl">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          Slotly
        </Link>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              {formatDate(event.startDate)} {"->"} {formatDate(event.endDate)}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">
              {event.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {participants.length} participant
              {participants.length === 1 ? "" : "s"} joined
            </p>
          </div>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-center text-sm font-medium"
            href={`/e/${eventId}/results`}
          >
            View results
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[18rem_1fr]">
          <aside className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <JoinEventForm eventId={event.id} />
          </aside>

          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {Array.from({ length: 28 }).map((_, index) => (
                <button
                  className="aspect-square rounded-[6px] border border-[var(--line)] bg-[#f2f2ec] text-xs text-[var(--muted)]"
                  key={index}
                  type="button"
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
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

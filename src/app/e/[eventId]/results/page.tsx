import Link from "next/link";

interface ResultsPageProps {
  readonly params: Promise<{
    readonly eventId: string;
  }>;
}

const rankedSlots = [
  { time: "Tuesday 20:00 -> 22:00", count: 12 },
  { time: "Wednesday 20:00 -> 22:00", count: 11 },
  { time: "Thursday 21:00 -> 23:00", count: 10 },
];

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = await params;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          Slotly
        </Link>
        <div className="mt-10">
          <p className="text-sm text-[var(--muted)]">Event {eventId}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">
            Best times
          </h1>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[22rem_1fr]">
          <section className="space-y-3">
            {rankedSlots.map((slot, index) => (
              <button
                className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4 text-left"
                key={slot.time}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-[var(--primary)]">
                      #{index + 1}
                    </span>
                    <p className="mt-1 font-medium">{slot.time}</p>
                  </div>
                  <span className="text-sm text-[var(--muted)]">
                    {slot.count} available
                  </span>
                </div>
              </button>
            ))}
          </section>

          <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold">Selected slot</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--primary)]">
                  Present
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li>Mael</li>
                  <li>Lucas</li>
                  <li>Emma</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--primary)]">
                  Absent
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li>Sarah</li>
                  <li>Tom</li>
                  <li>Jules</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

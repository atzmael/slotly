import Link from "next/link";

interface EventPageProps {
  readonly params: Promise<{
    readonly eventId: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          Slotly
        </Link>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">Event {eventId}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">
              Add availability
            </h1>
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
            <label className="block">
              <span className="text-sm font-medium">Your name</span>
              <input
                className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--primary)]"
                placeholder="Mael"
                type="text"
              />
            </label>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Timezone will be detected automatically on the interactive grid.
            </p>
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

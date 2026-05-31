import Link from "next/link";

const valueProps = [
  "No accounts",
  "Mobile-first availability",
  "Automatic best-slot ranking",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-normal">Slotly</span>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
            href="/new"
          >
            Create Poll
          </Link>
        </header>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase text-[var(--primary)]">
              When2Meet, rebuilt for phones
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-7xl">
              Find the best time without the spreadsheet feeling.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Create a link, collect availability, and instantly know the best
              time to meet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)]"
                href="/new"
              >
                Create Poll
              </Link>
            </div>
          </div>

          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Best slots</span>
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold">
                Live
              </span>
            </div>
            <div className="space-y-3">
              {[
                ["Tue 20:00", "12 available", "w-full"],
                ["Wed 20:00", "11 available", "w-11/12"],
                ["Thu 21:00", "10 available", "w-10/12"],
              ].map(([time, count, width]) => (
                <div key={time} className="rounded-[8px] border border-[var(--line)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium">{time}</span>
                    <span className="text-sm text-[var(--muted)]">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#ecece4]">
                    <div
                      className={`${width} h-2 rounded-full bg-[var(--primary)]`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-[var(--line)] py-5 text-sm text-[var(--muted)] sm:grid-cols-3">
          {valueProps.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </footer>
      </section>
    </main>
  );
}

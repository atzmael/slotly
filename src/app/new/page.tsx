import Link from "next/link";
import { NewPollForm } from "./new-poll-form";

export default function NewPollPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto w-full max-w-2xl">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          Slotly
        </Link>
        <div className="mt-10">
          <h1 className="text-4xl font-semibold tracking-normal">
            Create a poll
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Set the basics now. Sharing and live availability come next.
          </p>
        </div>

        <NewPollForm />
      </section>
    </main>
  );
}

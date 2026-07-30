import Link from "next/link";
import { getRequestLocale } from "@/i18n/locale";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { messages } from "@/i18n/messages";
import { BrandMark } from "./brand-mark";

export default async function HomePage() {
  const locale = await getRequestLocale();
  const t = messages[locale];

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:min-h-[min(760px,calc(100vh-3rem))] lg:gap-12">
        <header className="flex items-center justify-between gap-3">
          <BrandMark />
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <Link className="sl-button sl-button-secondary" href="/new">
              {t.home.createPoll}
            </Link>
          </div>
        </header>

        <div className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase text-[var(--primary)]">
              {t.home.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-7xl">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
              {t.home.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="sl-button sl-button-primary px-5 py-3"
                href="/new"
              >
                {t.home.createPoll}
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {t.home.valueProps.map((value) => (
                <span
                  className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] shadow-[0_4px_14px_rgb(15_23_42_/_5%)]"
                  key={value}
                >
                  {value}
                </span>
              ))}
            </div>
          </div>

          <div className="sl-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">{t.home.bestSlots}</span>
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold">
                {t.home.live}
              </span>
            </div>
            <div className="space-y-3">
              {t.home.demoSlots.map(([time, count, width]) => (
                <div key={time} className="sl-panel p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium">{time}</span>
                    <span className="text-sm text-[var(--muted)]">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--line-soft)]">
                    <div
                      className={`${width} h-2 rounded-full bg-[var(--primary)]`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

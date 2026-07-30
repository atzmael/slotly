import type { Metadata } from "next";
import Link from "next/link";
import { getRequestLocale } from "@/i18n/locale";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { messages } from "@/i18n/messages";
import { BrandMark } from "../brand-mark";
import { createPageMetadata } from "../site-metadata";
import { NewPollForm } from "./new-poll-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = messages[locale].meta;

  return createPageMetadata({
    locale,
    title: t.createTitle,
    description: t.createDescription,
    path: "/new",
  });
}

export default async function NewPollPage() {
  const locale = await getRequestLocale();
  const t = messages[locale].create;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="text-sm font-semibold text-[var(--primary)]"
            href="/"
          >
            <BrandMark size="sm" />
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="mt-10">
          <h1 className="text-4xl font-semibold tracking-normal">{t.title}</h1>
          <p className="mt-3 text-[var(--muted)]">{t.subtitle}</p>
        </div>

        <NewPollForm locale={locale} />
      </section>
    </main>
  );
}

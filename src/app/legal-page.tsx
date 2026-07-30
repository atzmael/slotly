import Link from "next/link";
import { getRequestLocale } from "@/i18n/locale";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { messages } from "@/i18n/messages";

interface LegalPageProps {
  readonly title: string;
  readonly updatedAt: string;
  readonly children: React.ReactNode;
}

export async function LegalPage({
  children,
  title,
  updatedAt,
}: LegalPageProps) {
  const locale = await getRequestLocale();
  const t = messages[locale].common;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="text-sm font-semibold text-[var(--primary)]"
            href="/"
          >
            {t.brand}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
        <article className="sl-panel mt-10 p-5 sm:p-7">
          <p className="text-sm text-[var(--muted)]">Updated {updatedAt}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {title}
          </h1>
          <div className="mt-6 space-y-6 text-sm leading-6 text-[var(--muted)] [&_a]:font-medium [&_a]:text-[var(--primary)] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[var(--foreground)] [&_li]:mt-1 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </section>
    </main>
  );
}

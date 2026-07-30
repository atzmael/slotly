import Link from "next/link";
import { getRequestLocale } from "@/i18n/locale";
import { messages } from "@/i18n/messages";
import { BrandMark } from "./brand-mark";

const contactEmail = "creadiv.tech+slotly@gmail.com";

export async function LegalFooter() {
  const locale = await getRequestLocale();
  const t = messages[locale].common;

  return (
    <footer className="px-5 pb-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <BrandMark size="sm" />
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link className="hover:text-[var(--primary)]" href="/legal">
            {t.legalNotice}
          </Link>
          <Link className="hover:text-[var(--primary)]" href="/terms">
            {t.terms}
          </Link>
          <Link className="hover:text-[var(--primary)]" href="/privacy">
            {t.privacy}
          </Link>
          <a
            className="hover:text-[var(--primary)]"
            href={`mailto:${contactEmail}`}
          >
            {t.feedback}
          </a>
        </nav>
      </div>
    </footer>
  );
}

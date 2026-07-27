"use client";

import { useRouter } from "next/navigation";
import { localeCookieName, locales, messages, type Locale } from "./messages";

interface LanguageSwitcherProps {
  readonly locale: Locale;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter();
  const t = messages[locale].common;

  function setLocale(nextLocale: Locale) {
    // eslint-disable-next-line react-hooks/immutability -- Persist the explicit locale choice for server-rendered pages.
    window.document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      aria-label={t.languageLabel}
      className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5 text-xs font-semibold"
      role="group"
    >
      {locales.map((option) => (
        <button
          aria-pressed={locale === option}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === option
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted)] hover:text-[var(--primary)]"
          }`}
          key={option}
          onClick={() => setLocale(option)}
          type="button"
        >
          {option === "en" ? t.languageEnglish : t.languageFrench}
        </button>
      ))}
    </div>
  );
}

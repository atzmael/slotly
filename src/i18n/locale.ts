import { cookies, headers } from "next/headers";
import { localeCookieName, locales, type Locale } from "./messages";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const requestHeaders = await headers();
  return resolveLocaleFromAcceptLanguage(
    requestHeaders.get("accept-language") ?? "",
  );
}

export function resolveLocaleFromAcceptLanguage(value: string): Locale {
  const requestedLocales = value
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter((part): part is string => Boolean(part));

  for (const requestedLocale of requestedLocales) {
    const baseLocale = requestedLocale.split("-")[0];

    if (isLocale(baseLocale)) {
      return baseLocale;
    }
  }

  return "en";
}

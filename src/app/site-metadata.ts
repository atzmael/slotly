import type { Metadata } from "next";
import type { Locale } from "@/i18n/messages";
import { messages } from "@/i18n/messages";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://slotly-meetings.vercel.app";

export const siteName = "Slotly";

const ogImages: Record<Locale, string> = {
  en: "/opengraph-image.png",
  fr: "/opengraph-image-fr.png",
};

interface PageMetadataOptions {
  readonly locale: Locale;
  readonly title: string;
  readonly description?: string;
  readonly path?: string;
  readonly noIndex?: boolean;
}

export function createPageMetadata({
  description,
  locale,
  noIndex = false,
  path = "/",
  title,
}: PageMetadataOptions): Metadata {
  const t = messages[locale].meta;
  const metadataDescription = description ?? t.siteDescription;
  const ogImage = ogImages[locale];

  return {
    title,
    description: metadataDescription,
    alternates: {
      canonical: path,
      languages: {
        en: path,
        fr: path,
      },
    },
    openGraph: {
      title,
      description: metadataDescription,
      url: path,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t.ogImageAlt,
        },
      ],
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: [locale === "fr" ? "en_US" : "fr_FR"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metadataDescription,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

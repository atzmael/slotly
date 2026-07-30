import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PageViewTracker } from "@/analytics/page-view-tracker";
import { getRequestLocale } from "@/i18n/locale";
import { LegalFooter } from "./legal-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slotly",
  description:
    "Create a link, collect availability, instantly know the best time to meet.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body>
        <PageViewTracker locale={locale} />
        {children}
        <LegalFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

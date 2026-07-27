import type { Metadata } from "next";
import { getRequestLocale } from "@/i18n/locale";
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
      <body>{children}</body>
    </html>
  );
}

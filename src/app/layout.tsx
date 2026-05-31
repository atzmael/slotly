import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slotly",
  description:
    "Create a link, collect availability, instantly know the best time to meet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

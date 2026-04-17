import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import { getMetadataBase } from "@/lib/seo";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "AInevoie",
  openGraph: {
    type: "website",
    siteName: "AInevoie",
  },
};

export default async function SiteRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

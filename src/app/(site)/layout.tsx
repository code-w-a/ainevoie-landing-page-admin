import { inter } from "@/lib/fonts";
import { getLocale } from "next-intl/server";

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

import { inter } from "@/lib/fonts";
import "../../css/style.css";
import StudioProviders from "@/app/(studio)/studio-providers";

export const metadata = {
  title: "Ainevoie Admin",
  description: "Admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <StudioProviders>{children}</StudioProviders>
      </body>
    </html>
  );
}

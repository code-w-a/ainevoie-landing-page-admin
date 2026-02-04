"use client";

import { ThemeProvider } from "next-themes";

export default function StudioProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider enableSystem={false} attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}

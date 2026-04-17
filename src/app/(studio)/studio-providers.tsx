"use client";

import { ThemeProvider } from "next-themes";

import { AdminToaster } from "@/components/admin/AdminToaster";

export default function StudioProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider enableSystem={false} attribute="class" defaultTheme="light">
      <AdminToaster />
      {children}
    </ThemeProvider>
  );
}

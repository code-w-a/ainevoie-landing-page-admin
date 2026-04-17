"use client";

import { SessionProvider } from "next-auth/react";

import { integrations } from "@integrations-config";

/**
 * When `isAuthEnabled` is false, the app serves a stub `/api/auth/[...nextauth]`
 * (501). `SessionProvider` would still call `/api/auth/session` on every page and
 * trigger [CLIENT_FETCH_ERROR]. Skip the provider until NextAuth is wired.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!integrations.isAuthEnabled) {
    return <>{children}</>;
  }

  return <SessionProvider>{children}</SessionProvider>;
}

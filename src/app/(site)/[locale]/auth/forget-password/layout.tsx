import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Resetare parolă | AInevoie",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: PropsWithChildren) {
  return children;
}

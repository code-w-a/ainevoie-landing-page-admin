import type { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Creează cont | Ainevoie",
  description: "Creează un cont Ainevoie pentru a solicita sau oferi servicii.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: PropsWithChildren) {
  return children;
}

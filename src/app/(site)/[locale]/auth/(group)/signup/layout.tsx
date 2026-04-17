import type { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Creează cont | AInevoie",
  description: "Creează un cont AInevoie pentru a solicita sau oferi servicii.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: PropsWithChildren) {
  return children;
}

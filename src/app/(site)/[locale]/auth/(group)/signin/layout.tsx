import type { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Autentificare | Ainevoie",
  description: "Intră în contul tău Ainevoie.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: PropsWithChildren) {
  return children;
}

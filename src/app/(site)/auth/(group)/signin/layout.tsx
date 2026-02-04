import type { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Autentificare | AInevoie",
  description: "Intră în contul tău AInevoie.",
  // other metadata
};

export default function Layout({ children }: PropsWithChildren) {
  return children;
}

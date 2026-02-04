import About from "@/components/About";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import Cta from "@/components/Cta";
import Faq from "@/components/Faq";
import Features from "@/components/Features";
import HeroArea from "@/components/HeroArea";
import Pricing from "@/components/Pricing";
import Screens from "@/components/Screens";
import Testimonials from "@/components/Testimonials";
import WorkProcess from "@/components/WorkProcess";
import { integrations } from "@integrations-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AInevoie — conectează rapid clienții cu firme de curățenie",
  description:
    "AInevoie este o platformă care conectează persoane și companii cu firme de curățenie: cauți, compari, programezi și plătești simplu, direct din aplicație.",
};

export default function Home() {
  return (
    <main>
      <HeroArea />
      <Features />
      <About />
      <WorkProcess />
      <Pricing />
      <Screens />
      <Cta />
      <Testimonials />
      <Faq />
      {integrations.isSanityEnabled && <Blog />}
      <Contact />
    </main>
  );
}

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
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo";
import { integrations } from "@integrations-config";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return buildLocalePageMetadata(locale, "/", {
    title: t("homeTitle"),
    description: t("homeDescription"),
  });
}

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

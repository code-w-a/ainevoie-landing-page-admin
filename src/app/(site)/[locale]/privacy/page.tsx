import { LegalMarkdown } from "@/components/Legal/LegalMarkdown";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo";
import { Metadata } from "next";
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
  return buildLocalePageMetadata(locale, "/privacy", {
    title: t("privacyMetaTitle"),
    description: t("privacyMetaDescription"),
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const tLegal = await getTranslations({ locale, namespace: "Legal" });

  return (
    <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
      <div className="container overflow-hidden lg:max-w-[1250px]">
        <div className="wow fadeInUp" data-wow-delay=".2s">
          <h1 className="mb-8 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px]">
            {tLegal("privacyTitle")}
          </h1>
          <LegalMarkdown slug="privacy" locale={locale} />
        </div>
      </div>
    </main>
  );
}

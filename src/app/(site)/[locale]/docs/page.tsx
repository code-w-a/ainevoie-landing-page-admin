import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo";
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
  const t = await getTranslations({ locale, namespace: "Docs" });
  return buildLocalePageMetadata(locale, "/docs", {
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function DocsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Docs" });

  return (
    <article>
      <h1>{t("introTitle")}</h1>

      <p className="text-body-color dark:text-body-color-dark text-base">
        {t("introP1")}
      </p>
      <p className="text-body-color dark:text-body-color-dark text-base">
        {t("introP2")}
      </p>
    </article>
  );
}

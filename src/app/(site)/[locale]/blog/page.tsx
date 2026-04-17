import BlogItem from "@/components/Blog/BlogItem";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo";
import { getPosts, isSanityConfigured } from "@/sanity/sanity-utils";
import { integrations, messages } from "@integrations-config";
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
  return buildLocalePageMetadata(locale, "/blog", {
    title: t("blogMetaTitle"),
    description: t("blogMetaDescription"),
  });
}

export default async function BlogGrid({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const posts = isSanityConfigured ? await getPosts(locale) : [];
  const t = await getTranslations({ locale, namespace: "Blog" });

  return (
    <main className="container max-w-[1400px] pt-[150px] pb-[60px] lg:pt-[220px]">
      {locale === "en" && (
        <p className="text-body mb-6 max-w-3xl text-base">{t("localeNote")}</p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] gap-5 lg:gap-8">
        {integrations?.isSanityEnabled && isSanityConfigured ? (
          posts?.map((item, key) => <BlogItem key={key} blog={item} />)
        ) : (
          <div>{messages.sanity}</div>
        )}
      </div>
    </main>
  );
}

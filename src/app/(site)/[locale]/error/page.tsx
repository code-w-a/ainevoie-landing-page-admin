import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
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
  return {
    title: t("error404MetaTitle"),
    description: t("error404MetaDescription"),
  };
}

export default async function ErrorPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ErrorPage" });

  return (
    <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
      <div className="container overflow-hidden lg:max-w-[1250px]">
        <div className="mx-auto w-full max-w-[570px]">
          <div className="wow fadeInUp mb-8 w-full" data-wow-delay=".2s">
            <Image
              src="/images/404/404.svg"
              alt=""
              className="mx-auto max-w-full"
              width={505}
              height={138}
            />
          </div>

          <div className="wow fadeInUp text-center" data-wow-delay=".2s">
            <h2 className="mb-[18px] text-[28px] font-bold text-black sm:text-[35px] dark:text-white">
              {t("notFoundTitle")}
            </h2>
            <p className="text-body mb-[30px] text-base font-medium sm:text-lg">
              {t("notFoundSubtitle")}
            </p>

            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 inline-flex justify-center rounded-md px-8 py-3 text-base font-medium text-white"
            >
              {t("notFoundCta")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

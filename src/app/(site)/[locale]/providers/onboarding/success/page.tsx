import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { CheckCircle2, CircleHelp, MailCheck, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export default async function ProviderOnboardingSuccessPage({
  params,
}: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ProviderSuccess" });

  const nextSteps = [
    {
      title: t("s1t"),
      description: t("s1d"),
      Icon: MailCheck,
    },
    {
      title: t("s2t"),
      description: t("s2d"),
      Icon: ShieldCheck,
    },
    {
      title: t("s3t"),
      description: t("s3d"),
      Icon: CheckCircle2,
    },
  ];

  return (
    <main className="pb-24 pt-[160px]">
      <section className="container max-w-[1100px]">
        <div className="mx-auto max-w-[820px] rounded-2xl bg-white p-8 text-center shadow-card dark:bg-dark dark:shadow-card-dark sm:p-10">
          <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-primary h-10 w-10" />
          </div>
          <span className="text-primary mb-3 block text-lg font-medium">
            {t("badge")}
          </span>
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-body mx-auto max-w-[680px] text-base">
            {t("intro")}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {nextSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl bg-white p-6 shadow-card dark:bg-dark dark:shadow-card-dark"
            >
              <div className="bg-primary/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                <step.Icon className="text-primary h-5 w-5" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
                {step.title}
              </h2>
              <p className="text-body text-sm">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-card dark:bg-dark dark:shadow-card-dark">
          <div className="flex flex-wrap items-start gap-3">
            <CircleHelp className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">
                {t("helpTitle")}
              </h3>
              <p className="text-body text-sm">
                {t("helpBefore")}{" "}
                <a
                  href="mailto:contact@ainevoie.ro"
                  className="text-primary hover:underline"
                >
                  contact@ainevoie.ro
                </a>
                {t("helpAfter")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-primary hover:bg-primary/90 inline-flex rounded-md px-6 py-3 text-sm font-medium text-white"
          >
            {t("backHome")}
          </Link>
          <Link
            href="/providers/onboarding/form"
            className="border-stroke dark:border-stroke-dark hover:border-primary inline-flex rounded-md border px-6 py-3 text-sm font-medium text-black dark:text-white"
          >
            {t("registerAnother")}
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ProviderIntroFinalCta() {
  const t = useTranslations("ProviderIntro");

  return (
    <section className="pb-12 sm:pb-16">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-dark sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">
              {t("finalTitle")}
            </h3>
            <p className="text-body mt-1 text-sm sm:text-base">
              {t("finalSubtitle")}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/providers/onboarding/form">{t("ctaPrimary")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

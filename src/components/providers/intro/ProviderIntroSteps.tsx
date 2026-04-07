"use client";

import { BadgeCheck, MailCheck, UserRoundPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export default function ProviderIntroSteps() {
  const t = useTranslations("ProviderIntro");

  const steps = useMemo(
    () => [
      { title: t("flowS1t"), description: t("flowS1d"), Icon: UserRoundPlus },
      { title: t("flowS2t"), description: t("flowS2d"), Icon: MailCheck },
      { title: t("flowS3t"), description: t("flowS3d"), Icon: BadgeCheck },
    ],
    [t]
  );

  return (
    <section id="steps" className="py-12 sm:py-16">
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
          {t("flowTitle")}
        </h2>
        <p className="text-body text-sm sm:text-base">{t("flowSubtitle")}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-dark sm:p-6"
          >
            <div className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
              <step.Icon className="h-5 w-5" />
            </div>
            <p className="text-primary mb-2 text-xs font-semibold">
              {t("flowStepBadge", { n: index + 1 })}
            </p>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">{step.title}</h3>
            <p className="text-body text-sm">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

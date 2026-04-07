"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export default function ProviderIntroNextSteps() {
  const t = useTranslations("ProviderIntro");

  const items = useMemo(
    () => [t("afterSignup1"), t("afterSignup2"), t("afterSignup3")],
    [t]
  );

  return (
    <section className="py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-dark sm:p-8">
        <h2 className="mb-4 text-2xl font-bold text-black dark:text-white sm:text-3xl">
          {t("afterSignupTitle")}
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-body text-sm sm:text-base">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";

export default function ProviderOnboardingSideInfo() {
  const t = useTranslations("ProviderForm");

  return (
    <>
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-dark sm:p-6">
        <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
          {t("sideNextTitle")}
        </h3>
        <ul className="text-body space-y-2 text-sm">
          <li>{t("sideNext1")}</li>
          <li>{t("sideNext2")}</li>
          <li>{t("sideNext3")}</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-dark sm:p-6">
        <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
          {t("sideHelpTitle")}
        </h3>
        <p className="text-body text-sm">
          {t("sideHelpBefore")}{" "}
          <a
            href="mailto:contact@ainevoie.ro"
            className="text-primary hover:underline"
          >
            contact@ainevoie.ro
          </a>
          {t("sideHelpAfter")}
        </p>
      </div>
    </>
  );
}

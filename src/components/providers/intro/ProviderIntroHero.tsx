"use client";

import { Badge } from "@/components/ui/badge";
import PhoneMockup from "@/components/PhoneMockup";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export default function ProviderIntroHero() {
  const t = useTranslations("ProviderIntro");
  const miniTitles = useMemo(
    () => [t("mini1"), t("mini2"), t("mini3")],
    [t]
  );

  return (
    <section id="home" className="pt-[165px]">
      <div className="-mx-4 flex flex-wrap items-center">
        <div className="w-full px-4 lg:w-7/12">
          <div className="mb-12 lg:mb-0 lg:max-w-[570px]">
            <span className="mb-5 block text-lg leading-tight font-medium text-black sm:text-[22px] xl:text-[22px] dark:text-white">
              {t("heroBadge")}
            </span>
            <h1 className="mb-4 text-3xl leading-tight font-bold text-black sm:text-[40px] md:text-[50px] lg:text-[42px] xl:text-[50px] dark:text-white">
              {t("titleBefore")}{" "}
              <span className="bg-gradient-1 inline bg-clip-text text-transparent">
                {t("titleHighlight")}
              </span>{" "}
              {t("titleAfter")}
            </h1>

            <p className="text-body mb-8 text-base leading-relaxed sm:text-[17px]">
              {t("subtitle")}
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {miniTitles.map((title) => (
                <Badge
                  key={title}
                  variant="secondary"
                  className="rounded-full px-3 py-1"
                >
                  {title}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/providers/onboarding/form">{t("ctaPrimary")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#beneficii-prestatori">{t("ctaSecondary")}</Link>
              </Button>
            </div>

            <p className="text-body mt-4 text-sm">{t("metaLine")}</p>
          </div>
        </div>

        <div className="w-full px-4 lg:w-5/12">
          <div className="relative z-10 mx-auto w-full max-w-[530px] pt-8 lg:mr-0">
            <PhoneMockup
              src="/images/screenshots/Prestator_calendar.jpg"
              alt={t("phoneAlt")}
              priority={true}
              sizes="(min-width: 1280px) 360px, (min-width: 1024px) 320px, 280px"
            />
            <div className="bg-gradient-1 absolute inset-x-0 top-0 -z-10 mx-auto aspect-square w-full rounded-full opacity-80" />

            <Badge className="absolute -left-2 top-7 rounded-full px-3 py-1 text-xs">
              {t("float1")}
            </Badge>
            <Badge className="absolute -right-2 top-1/2 rounded-full px-3 py-1 text-xs">
              {t("float2")}
            </Badge>
            <Badge className="absolute left-6 bottom-4 rounded-full px-3 py-1 text-xs">
              {t("float3")}
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

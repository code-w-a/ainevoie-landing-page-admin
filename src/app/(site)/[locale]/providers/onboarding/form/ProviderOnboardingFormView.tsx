"use client";

import ProviderOnboardingFormCard from "@/components/providers/ProviderOnboardingFormCard";
import ProviderOnboardingSideInfo from "@/components/providers/ProviderOnboardingSideInfo";
import { PROVIDER_ONBOARDING_MAX_STEP } from "@/constants/providerOnboarding";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function parseStepFromSearchParam(raw: string | null): number {
  const n = raw != null ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(PROVIDER_ONBOARDING_MAX_STEP, Math.floor(n));
}

export function ProviderOnboardingFormView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStepState] = useState(() =>
    parseStepFromSearchParam(searchParams.get("step")),
  );

  useEffect(() => {
    const fromUrl = parseStepFromSearchParam(searchParams.get("step"));
    setCurrentStepState((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);

  const onStepChange = useCallback(
    (step: number) => {
      const clamped = Math.max(1, Math.min(PROVIDER_ONBOARDING_MAX_STEP, Math.round(step)));
      setCurrentStepState(clamped);
      const next = new URLSearchParams(searchParams.toString());
      next.set("step", String(clamped));
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <main className="pb-16 pt-[140px] sm:pb-24 sm:pt-[160px]">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <ProviderOnboardingFormCard currentStep={currentStep} onStepChange={onStepChange} />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProviderOnboardingSideInfo />
          </div>
        </div>
      </section>
    </main>
  );
}

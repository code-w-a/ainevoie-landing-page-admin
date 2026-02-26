"use client";

import ProviderOnboardingFormCard from "@/components/providers/ProviderOnboardingFormCard";
import ProviderOnboardingSideInfo from "@/components/providers/ProviderOnboardingSideInfo";
import { useState } from "react";

export default function ProviderOnboardingFormPage() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <main className="pb-16 pt-[140px] sm:pb-24 sm:pt-[160px]">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <ProviderOnboardingFormCard
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProviderOnboardingSideInfo />
          </div>
        </div>
      </section>
    </main>
  );
}

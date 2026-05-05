import { ProviderOnboardingFormView } from "./ProviderOnboardingFormView";
import { Suspense } from "react";

function OnboardingFormSkeleton() {
  return (
    <main className="min-h-[480px] animate-pulse pb-16 pt-[140px] sm:pb-24 sm:pt-[160px]">
      <div className="mx-auto max-w-5xl rounded-xl border border-border bg-muted/40 px-4 py-20 sm:px-6" />
    </main>
  );
}

export default function ProviderOnboardingFormPage() {
  return (
    <Suspense fallback={<OnboardingFormSkeleton />}>
      <ProviderOnboardingFormView />
    </Suspense>
  );
}

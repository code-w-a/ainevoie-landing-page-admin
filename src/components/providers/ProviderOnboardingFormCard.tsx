import HorizontalTimelineStepper from "@/components/providers/HorizontalTimelineStepper";
import ProviderOnboardingFormWizard from "@/components/providers/ProviderOnboardingFormWizard";

type ProviderOnboardingFormCardProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
};

export default function ProviderOnboardingFormCard({
  currentStep,
  onStepChange,
}: ProviderOnboardingFormCardProps) {
  return (
    <div className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-dark sm:p-8">
      <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">
        Creează-ți contul de prestator
      </h2>

      <div className="mb-4 border-b border-border pb-4 sm:mb-5 sm:pb-5">
        <HorizontalTimelineStepper currentStep={currentStep} />
        <p className="mt-3 text-sm text-muted-foreground">
          Pasul {currentStep} din 3 • Completează câmpurile și continuă.
        </p>
      </div>

      <ProviderOnboardingFormWizard
        currentStep={currentStep}
        onStepChange={onStepChange}
      />
    </div>
  );
}

type Step = {
  id: number;
  title: string;
  description: string;
};

type ProviderStepperProps = {
  steps: Step[];
  currentStep: number;
};

export default function ProviderStepper({
  steps,
  currentStep,
}: ProviderStepperProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card dark:bg-dark dark:shadow-card-dark sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-black dark:text-white sm:mb-4 sm:text-lg">
        Pașii onboarding-ului
      </h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;
          return (
            <div
              key={step.id}
              className={`min-w-[200px] snap-start rounded-xl border p-3 sm:min-w-[220px] sm:p-4 lg:min-w-0 ${
                isActive
                  ? "border-primary bg-primary/5"
                  : isDone
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-border bg-background"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id}
                </span>
                <p className="text-xs font-semibold text-black dark:text-white sm:text-sm">
                  {step.title}
                </p>
              </div>
              <p className="text-body text-[11px] leading-relaxed sm:text-xs">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

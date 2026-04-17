"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type HorizontalTimelineStepperProps = {
  currentStep: number;
};

export default function HorizontalTimelineStepper({
  currentStep,
}: HorizontalTimelineStepperProps) {
  const t = useTranslations("ProviderForm");

  const steps = useMemo(
    () => [
      { id: 1, label: t("stepContact") },
      { id: 2, label: t("stepServices") },
      { id: 3, label: t("stepConfirm") },
    ],
    [t]
  );

  const safeStep = Math.min(Math.max(currentStep, 1), steps.length);
  const n = steps.length;
  /** Center of step k (1-based) in an equal grid: (2k-1)/(2n) of width; line ends at left edge of that circle. */
  const circleRadiusRem = 0.875; // sm:h-7 w-7 → half ≈ 0.875rem (h-6 slightly smaller; unificat vizual)
  const lineEndFraction = (2 * safeStep - 1) / (2 * n);
  const orangeLineWidth = `calc(${lineEndFraction * 100}% - ${circleRadiusRem}rem)`;
  const currentLabel = steps[safeStep - 1]?.label ?? "";

  return (
    <div className="w-full rounded-xl border border-border bg-background/60 p-3 sm:p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground sm:hidden">
        {t("stepperMobile", { step: safeStep, label: currentLabel })}
      </p>

      <div className="relative">
        <div
          className="absolute top-3 left-0 right-0 h-0.5 bg-border sm:top-3.5"
          aria-hidden="true"
        />
        <div
          className="bg-primary absolute top-3 left-0 h-0.5 transition-[width] duration-300 sm:top-3.5"
          style={{ width: orangeLineWidth, maxWidth: "100%" }}
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-3">
          {steps.map((step) => {
            const isCompleted = step.id < safeStep;
            const isCurrent = step.id === safeStep;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold sm:h-7 sm:w-7 ${
                    isCompleted
                      ? "bg-primary border-primary text-white"
                      : isCurrent
                        ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                        : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                </span>
                <span className="mt-2 max-w-[86px] text-center text-[11px] leading-tight text-muted-foreground sm:max-w-none sm:text-xs">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

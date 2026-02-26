"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { providerCityOptions, providerServiceOptions } from "@/lib/providers";
import { PROVIDER_LEGAL_STATUSES, type ProviderLegalStatus } from "@/types/provider";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  serviceType: string;
  legalStatus: ProviderLegalStatus;
  companyName: string;
  cui: string;
  tradeRegisterNumber: string;
  estimatedSetupTimeline: string;
  hasAccountant: "yes" | "no" | "unsure";
  acceptTerms: boolean;
};

type ProviderOnboardingFormWizardProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
};

const legalStatusOptions: Array<{ value: ProviderLegalStatus; label: string }> = [
  { value: "pfa_ready", label: "Am PFA" },
  { value: "srl_ready", label: "Am SRL" },
  { value: "in_progress", label: "Sunt în curs de înființare" },
  { value: "need_guidance", label: "Am nevoie de ghidaj" },
];

export default function ProviderOnboardingFormWizard({
  currentStep,
  onStepChange,
}: ProviderOnboardingFormWizardProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      legalStatus: PROVIDER_LEGAL_STATUSES[0],
      confirmPassword: "",
      companyName: "",
      cui: "",
      tradeRegisterNumber: "",
      estimatedSetupTimeline: "",
      hasAccountant: "unsure",
      city: providerCityOptions[0],
      serviceType: providerServiceOptions[0],
      acceptTerms: false,
    },
  });
  const legalStatus = watch("legalStatus");
  const isLegalEntityReady = legalStatus === "pfa_ready" || legalStatus === "srl_ready";
  const isEntityInProgress = legalStatus === "in_progress";

  async function goNextStep() {
    const stepFields: Record<number, Array<keyof FormValues>> = {
      1: ["fullName", "email", "password", "confirmPassword", "phone"],
      2: ["city", "serviceType"],
      3: [
        "legalStatus",
        "companyName",
        "cui",
        "tradeRegisterNumber",
        "estimatedSetupTimeline",
        "hasAccountant",
        "acceptTerms",
      ],
    };
    const valid = await trigger(stepFields[currentStep]);
    if (valid) {
      onStepChange(Math.min(3, currentStep + 1));
    }
  }

  function goBackStep() {
    onStepChange(Math.max(1, currentStep - 1));
  }

  async function onSubmit(values: FormValues) {
    const { confirmPassword, ...payload } = values;
    try {
      const res = await axios.post("/api/providers/onboarding", payload);
      if (res.status === 200) {
        toast.success("Cont creat cu succes.");
        router.push("/providers/onboarding/success");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Nu am putut finaliza înregistrarea. Încearcă din nou.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      {currentStep === 1 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputGroup
              label="Nume complet"
              placeholder="Ex: Andrei Popescu"
              {...register("fullName", { required: "Numele este obligatoriu." })}
              errorMessages={errors.fullName?.message}
            />
            <InputGroup
              type="email"
              label="Email"
              placeholder="Ex: andrei@email.ro"
              {...register("email", {
                required: "Emailul este obligatoriu.",
                validate: (value) => value.includes("@") || "Email invalid.",
              })}
              errorMessages={errors.email?.message}
            />
            <fieldset>
              <label htmlFor="provider-password" className="mb-2.5 inline-block text-sm">
                Parolă
              </label>
              <div className="relative">
                <input
                  id="provider-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minim 8 caractere"
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 pr-12 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("password", {
                    required: "Parola este obligatorie.",
                    minLength: {
                      value: 8,
                      message: "Parola trebuie să aibă minim 8 caractere.",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center"
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="mt-2 text-xs text-red-500">{errors.password.message}</p>
              )}
            </fieldset>
            <fieldset>
              <label htmlFor="provider-confirm-password" className="mb-2.5 inline-block text-sm">
                Confirmă parola
              </label>
              <div className="relative">
                <input
                  id="provider-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Reintrodu parola"
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 pr-12 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("confirmPassword", {
                    required: "Confirmarea parolei este obligatorie.",
                    validate: (value) =>
                      value === getValues("password") || "Parolele nu se potrivesc.",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center"
                  aria-label={
                    showConfirmPassword
                      ? "Ascunde confirmarea parolei"
                      : "Arată confirmarea parolei"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword?.message && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </fieldset>
            <div className="md:col-span-2">
              <InputGroup
                label="Telefon"
                placeholder="07xx xxx xxx"
                {...register("phone", { required: "Telefonul este obligatoriu." })}
                errorMessages={errors.phone?.message}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Folosim aceste date doar pentru activarea contului și comunicări operaționale.
          </p>
        </>
      )}

      {currentStep === 2 && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <fieldset>
            <label htmlFor="provider-city" className="mb-2.5 inline-block text-sm">
              Oraș
            </label>
            <select
              id="provider-city"
              aria-label="Oraș"
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
              {...register("city", { required: "Orașul este obligatoriu." })}
            >
              {providerCityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.city?.message && (
              <p className="mt-2 text-xs text-red-500">{errors.city.message}</p>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="provider-service" className="mb-2.5 inline-block text-sm">
              Tip serviciu
            </label>
            <select
              id="provider-service"
              aria-label="Tip serviciu"
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
              {...register("serviceType", {
                required: "Tipul serviciului este obligatoriu.",
              })}
            >
              {providerServiceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.serviceType?.message && (
              <p className="mt-2 text-xs text-red-500">{errors.serviceType.message}</p>
            )}
          </fieldset>
        </div>
      )}

      {currentStep === 3 && (
        <>
          <fieldset>
            <label htmlFor="provider-legal-status" className="mb-2.5 inline-block text-sm">
              Status juridic
            </label>
            <select
              id="provider-legal-status"
              aria-label="Status juridic"
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
              {...register("legalStatus", { required: "Selectează statusul juridic." })}
            >
              {legalStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.legalStatus?.message && (
              <p className="mt-2 text-xs text-red-500">{errors.legalStatus.message}</p>
            )}
          </fieldset>

          {isLegalEntityReady && (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputGroup
                  label="Nume companie / PFA"
                  placeholder="Ex: SC Curat Expert SRL"
                  {...register("companyName", {
                    validate: (value) =>
                      !isLegalEntityReady || value.trim().length > 1 || "Numele companiei este obligatoriu.",
                  })}
                  errorMessages={errors.companyName?.message}
                />
              </div>
              <InputGroup
                label="CUI"
                placeholder="Ex: RO12345678"
                {...register("cui", {
                  validate: (value) =>
                    !isLegalEntityReady || value.trim().length > 1 || "CUI este obligatoriu.",
                })}
                errorMessages={errors.cui?.message}
              />
              <InputGroup
                label="Nr. Registrul Comerțului (opțional)"
                placeholder="Ex: J40/1234/2024"
                {...register("tradeRegisterNumber")}
                errorMessages={errors.tradeRegisterNumber?.message}
              />
            </div>
          )}

          {isEntityInProgress && (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <fieldset>
                <label htmlFor="setup-timeline" className="mb-2.5 inline-block text-sm">
                  Estimare finalizare înființare
                </label>
                <select
                  id="setup-timeline"
                  aria-label="Estimare finalizare înființare"
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("estimatedSetupTimeline", {
                    validate: (value) =>
                      !isEntityInProgress ||
                      value.trim().length > 0 ||
                      "Alege un interval estimativ.",
                  })}
                >
                  <option value="">Selectează intervalul</option>
                  <option value="1_2_weeks">1-2 săptămâni</option>
                  <option value="2_4_weeks">2-4 săptămâni</option>
                  <option value="1_2_months">1-2 luni</option>
                  <option value="over_2_months">Peste 2 luni</option>
                </select>
                {errors.estimatedSetupTimeline?.message && (
                  <p className="mt-2 text-xs text-red-500">{errors.estimatedSetupTimeline.message}</p>
                )}
              </fieldset>
              <fieldset>
                <label htmlFor="has-accountant" className="mb-2.5 inline-block text-sm">
                  Ai contabil/partener pentru înființare?
                </label>
                <select
                  id="has-accountant"
                  aria-label="Ai contabil"
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("hasAccountant")}
                >
                  <option value="unsure">Încă nu știu</option>
                  <option value="yes">Da</option>
                  <option value="no">Nu</option>
                </select>
              </fieldset>
            </div>
          )}

          <Controller
            control={control}
            name="acceptTerms"
            rules={{
              required: "Trebuie să accepți termenii și politica de confidențialitate.",
            }}
            render={({ field, fieldState }) => (
              <div>
                <Checkbox
                  name={field.name}
                  onChange={(event) => field.onChange(event.target.checked)}
                  defaultChecked={field.value}
                  label={
                    <>
                      Sunt de acord cu termenii și condițiile și cu politica de confidențialitate.
                    </>
                  }
                />
                {fieldState.error && (
                  <p className="mt-2 text-xs text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={goBackStep}
          disabled={currentStep === 1 || isSubmitting}
          className="border-stroke dark:border-stroke-dark hover:border-primary rounded-md border px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Înapoi
        </button>
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={goNextStep}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Continuă la pasul următor
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? "Se trimite..." : "Finalizează înregistrarea"}
          </button>
        )}
      </div>
    </form>
  );
}

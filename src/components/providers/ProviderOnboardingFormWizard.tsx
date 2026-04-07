"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import {
  PROVIDER_CITY_ENTRIES,
  PROVIDER_SERVICE_ENTRIES,
} from "@/lib/providers";
import { PROVIDER_LEGAL_STATUSES, type ProviderLegalStatus } from "@/types/provider";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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
  newsletterOptIn: boolean;
  acceptTerms: boolean;
};

type ProviderOnboardingFormWizardProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
};

function isValidEmail(value: string) {
  return value.includes("@");
}

export default function ProviderOnboardingFormWizard({
  currentStep,
  onStepChange,
}: ProviderOnboardingFormWizardProps) {
  const t = useTranslations("ProviderWizard");
  const locale = useLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const legalStatusOptions = useMemo(
    () =>
      [
        { value: "pfa_ready" as const, label: t("legalPfa") },
        { value: "srl_ready" as const, label: t("legalSrl") },
        { value: "in_progress" as const, label: t("legalInProgress") },
        { value: "need_guidance" as const, label: t("legalGuidance") },
      ],
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
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
      newsletterOptIn: false,
      city: PROVIDER_CITY_ENTRIES[0].value,
      serviceType: PROVIDER_SERVICE_ENTRIES[0].value,
      acceptTerms: false,
    },
  });
  const emailValue = watch("email");
  const legalStatus = watch("legalStatus");
  const normalizedEmail = (emailValue || "").trim().toLowerCase();
  const hasValidEmailForNewsletter = isValidEmail(normalizedEmail);
  const isLegalEntityReady = legalStatus === "pfa_ready" || legalStatus === "srl_ready";
  const isEntityInProgress = legalStatus === "in_progress";
  const [newsletterStatusLoading, setNewsletterStatusLoading] = useState(false);
  const [isActiveNewsletterSubscriber, setIsActiveNewsletterSubscriber] = useState(false);
  const [newsletterStatusError, setNewsletterStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidEmailForNewsletter) {
      setNewsletterStatusLoading(false);
      setNewsletterStatusError(null);
      setIsActiveNewsletterSubscriber(false);
      return;
    }

    setNewsletterStatusLoading(true);
    setNewsletterStatusError(null);
    setIsActiveNewsletterSubscriber(false);

    let isCancelled = false;
    const timerId = window.setTimeout(async () => {
      try {
        const response = await axios.get<{ isActiveSubscriber?: boolean }>(
          "/api/newsletter/status",
          {
            params: { email: normalizedEmail },
            headers: { "x-next-intl-locale": locale },
          }
        );

        if (isCancelled) {
          return;
        }

        const isActive = response.data?.isActiveSubscriber === true;
        setIsActiveNewsletterSubscriber(isActive);

        if (isActive) {
          setValue("newsletterOptIn", false);
        }
      } catch {
        if (isCancelled) {
          return;
        }

        setIsActiveNewsletterSubscriber(false);
        setNewsletterStatusError(t("newsletterCheckError"));
      } finally {
        if (!isCancelled) {
          setNewsletterStatusLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [hasValidEmailForNewsletter, locale, normalizedEmail, setValue, t]);

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
      const res = await axios.post("/api/providers/onboarding", {
        ...payload,
        locale,
      }, {
        headers: { "x-next-intl-locale": locale },
      });
      if (res.status === 200) {
        toast.success(t("toastSuccess"));
        router.push("/providers/onboarding/success");
      }
    } catch (error: unknown) {
      const ax = error as {
        response?: { data?: { error?: string; code?: string } };
      };
      const data = ax.response?.data;
      const message =
        typeof data?.error === "string" && data.error.length > 0
          ? data.error
          : t("toastGenericError");
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      {currentStep === 1 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputGroup
              label={t("fullNameLabel")}
              placeholder={t("fullNamePh")}
              {...register("fullName", { required: t("fullNameRequired") })}
              errorMessages={errors.fullName?.message}
            />
            <InputGroup
              type="email"
              label={t("emailLabel")}
              placeholder={t("emailPh")}
              {...register("email", {
                required: t("emailRequired"),
                validate: (value) => value.includes("@") || t("emailInvalid"),
              })}
              errorMessages={errors.email?.message}
            />
            <fieldset>
              <label htmlFor="provider-password" className="mb-2.5 inline-block text-sm">
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <input
                  id="provider-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPh")}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 pr-12 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("password", {
                    required: t("passwordRequired"),
                    minLength: {
                      value: 8,
                      message: t("passwordMin"),
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
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
                {t("confirmPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  id="provider-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("confirmPasswordPh")}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 pr-12 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("confirmPassword", {
                    required: t("confirmPasswordRequired"),
                    validate: (value) =>
                      value === getValues("password") || t("passwordMismatch"),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center"
                  aria-label={
                    showConfirmPassword ? t("hideConfirmPassword") : t("showConfirmPassword")
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
                label={t("phoneLabel")}
                placeholder={t("phonePh")}
                {...register("phone", { required: t("phoneRequired") })}
                errorMessages={errors.phone?.message}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("step1Footnote")}</p>
        </>
      )}

      {currentStep === 2 && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <fieldset>
            <label htmlFor="provider-city" className="mb-2.5 inline-block text-sm">
              {t("cityLabel")}
            </label>
            <select
              id="provider-city"
              aria-label={t("cityAria")}
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
              {...register("city", { required: t("cityRequired") })}
            >
              {PROVIDER_CITY_ENTRIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {t(entry.messageKey)}
                </option>
              ))}
            </select>
            {errors.city?.message && (
              <p className="mt-2 text-xs text-red-500">{errors.city.message}</p>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="provider-service" className="mb-2.5 inline-block text-sm">
              {t("serviceLabel")}
            </label>
            <select
              id="provider-service"
              aria-label={t("serviceAria")}
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
              {...register("serviceType", {
                required: t("serviceRequired"),
              })}
            >
              {PROVIDER_SERVICE_ENTRIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {t(entry.messageKey)}
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
              {t("legalStatusLabel")}
            </label>
            <select
              id="provider-legal-status"
              aria-label={t("legalStatusAria")}
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
              {...register("legalStatus", { required: t("legalStatusRequired") })}
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
                  label={t("companyLabel")}
                  placeholder={t("companyPh")}
                  {...register("companyName", {
                    validate: (value) =>
                      !isLegalEntityReady || value.trim().length > 1 || t("companyRequired"),
                  })}
                  errorMessages={errors.companyName?.message}
                />
              </div>
              <InputGroup
                label={t("cuiLabel")}
                placeholder={t("cuiPh")}
                {...register("cui", {
                  validate: (value) =>
                    !isLegalEntityReady || value.trim().length > 1 || t("cuiRequired"),
                })}
                errorMessages={errors.cui?.message}
              />
              <InputGroup
                label={t("tradeRegisterLabel")}
                placeholder={t("tradeRegisterPh")}
                {...register("tradeRegisterNumber")}
                errorMessages={errors.tradeRegisterNumber?.message}
              />
            </div>
          )}

          {isEntityInProgress && (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <fieldset>
                <label htmlFor="setup-timeline" className="mb-2.5 inline-block text-sm">
                  {t("timelineLabel")}
                </label>
                <select
                  id="setup-timeline"
                  aria-label={t("timelineAria")}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("estimatedSetupTimeline", {
                    validate: (value) =>
                      !isEntityInProgress ||
                      value.trim().length > 0 ||
                      t("timelineRequired"),
                  })}
                >
                  <option value="">{t("timelinePlaceholder")}</option>
                  <option value="1_2_weeks">{t("timeline1_2_weeks")}</option>
                  <option value="2_4_weeks">{t("timeline2_4_weeks")}</option>
                  <option value="1_2_months">{t("timeline1_2_months")}</option>
                  <option value="over_2_months">{t("timelineOver2")}</option>
                </select>
                {errors.estimatedSetupTimeline?.message && (
                  <p className="mt-2 text-xs text-red-500">{errors.estimatedSetupTimeline.message}</p>
                )}
              </fieldset>
              <fieldset>
                <label htmlFor="has-accountant" className="mb-2.5 inline-block text-sm">
                  {t("accountantLabel")}
                </label>
                <select
                  id="has-accountant"
                  aria-label={t("accountantAria")}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
                  {...register("hasAccountant")}
                >
                  <option value="unsure">{t("accountantUnsure")}</option>
                  <option value="yes">{t("accountantYes")}</option>
                  <option value="no">{t("accountantNo")}</option>
                </select>
              </fieldset>
            </div>
          )}

          {hasValidEmailForNewsletter && (
            <div className="rounded-md border border-border p-3 sm:p-4">
              <p className="mb-2 text-sm font-medium">{t("newsletterTitle")}</p>

              {newsletterStatusLoading ? (
                <p className="text-xs text-muted-foreground">{t("newsletterChecking")}</p>
              ) : isActiveNewsletterSubscriber ? (
                <p className="text-xs text-muted-foreground">{t("newsletterSubscribed")}</p>
              ) : (
                <Controller
                  control={control}
                  name="newsletterOptIn"
                  render={({ field }) => (
                    <Checkbox
                      name={field.name}
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      label={t("newsletterOptIn")}
                    />
                  )}
                />
              )}

              {newsletterStatusError && !newsletterStatusLoading && (
                <p className="mt-2 text-xs text-muted-foreground">{newsletterStatusError}</p>
              )}
            </div>
          )}

          <Controller
            control={control}
            name="acceptTerms"
            rules={{
              required: t("termsRequired"),
            }}
            render={({ field, fieldState }) => (
              <div>
                <Checkbox
                  name={field.name}
                  onChange={(event) => field.onChange(event.target.checked)}
                  defaultChecked={field.value}
                  label={
                    <>
                      {t("termsAgree")}{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        {t("termsLink")}
                      </Link>{" "}
                      {t("termsAnd")}{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        {t("privacyLink")}
                      </Link>
                      {t("termsEnd")}
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
          {t("back")}
        </button>
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={goNextStep}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t("next")}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { getFirebaseAuth, getFirebaseFunctions, getFirebaseStorage } from "@/lib/firebaseClient";
import { PROVIDER_SERVICE_ENTRIES } from "@/lib/providers";
import {
  ROMANIA_COUNTIES,
  findRomaniaCity,
  getCitiesByCounty,
  normalizeRomaniaLocationName,
} from "@/lib/romaniaLocations";
import { PROVIDER_LEGAL_STATUSES, type ProviderLegalStatus } from "@/types/provider";
import axios from "axios";
import { signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
import { ChevronDown, Eye, EyeOff, FileCheck2, ImagePlus, UploadCloud } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  countyCode: string;
  cityCode: string;
  serviceType: string;
  legalStatus: ProviderLegalStatus;
  companyName: string;
  cui: string;
  tradeRegisterNumber: string;
  estimatedSetupTimeline: string;
  hasAccountant: "yes" | "no" | "unsure";
  newsletterOptIn: boolean;
  launchContactConsent: boolean;
  acceptTerms: boolean;
};

type ProviderOnboardingFormWizardProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
};

type UploadState = "empty" | "added" | "uploading" | "uploaded" | "error";
type FileSlot = {
  file: File | null;
  previewUrl: string | null;
  status: UploadState;
  storagePath: string | null;
  error: string | null;
};

const MAX_STEP = 6;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function emptyFileSlot(): FileSlot {
  return {
    file: null,
    previewUrl: null,
    status: "empty",
    storagePath: null,
    error: null,
  };
}

function isValidEmail(value: string) {
  return value.includes("@");
}

function sanitizeFileName(file: File) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return `${Date.now()}-${safeName || "upload.jpg"}`;
}

function assertImageFile(file: File, errorMessage: string) {
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
    throw new Error(errorMessage);
  }
}

function readCallableError(error: unknown, fallback: string) {
  const err = error as { message?: string; code?: string; details?: unknown };
  if (typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }
  return fallback;
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
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [newsletterStatusLoading, setNewsletterStatusLoading] = useState(false);
  const [isActiveNewsletterSubscriber, setIsActiveNewsletterSubscriber] = useState(false);
  const [newsletterStatusError, setNewsletterStatusError] = useState<string | null>(null);
  const [providerUid, setProviderUid] = useState<string | null>(null);
  const [accountCreating, setAccountCreating] = useState(false);
  const [avatar, setAvatar] = useState<FileSlot>(() => emptyFileSlot());
  const [identityDocument, setIdentityDocument] = useState<FileSlot>(() => emptyFileSlot());
  const [professionalDocument, setProfessionalDocument] = useState<FileSlot>(() => emptyFileSlot());
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);
  const cityComboRef = useRef<HTMLDivElement>(null);
  const citySearchInputRef = useRef<HTMLInputElement>(null);

  const legalStatusOptions = useMemo(
    () => [
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
    formState: { errors },
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
      launchContactConsent: false,
      countyCode: "",
      cityCode: "",
      serviceType: PROVIDER_SERVICE_ENTRIES[0].value,
      acceptTerms: false,
    },
  });

  const emailValue = watch("email");
  const legalStatus = watch("legalStatus");
  const selectedCountyCode = watch("countyCode");
  const selectedCityCode = watch("cityCode");
  const normalizedEmail = (emailValue || "").trim().toLowerCase();
  const hasValidEmailForNewsletter = isValidEmail(normalizedEmail);
  const isLegalEntityReady = legalStatus === "pfa_ready" || legalStatus === "srl_ready";
  const isEntityInProgress = legalStatus === "in_progress";
  const selectedCityRecord = useMemo(
    () => findRomaniaCity(selectedCountyCode, selectedCityCode),
    [selectedCountyCode, selectedCityCode]
  );
  const availableCities = useMemo(
    () => getCitiesByCounty(selectedCountyCode),
    [selectedCountyCode]
  );
  const normalizedCitySearch = normalizeRomaniaLocationName(citySearch);
  const filteredCities = useMemo(() => {
    if (!normalizedCitySearch) return availableCities;
    return availableCities.filter((city) =>
      normalizeRomaniaLocationName(city.cityName).includes(normalizedCitySearch)
    );
  }, [availableCities, normalizedCitySearch]);
  const busy = accountCreating || finalSubmitting;

  useEffect(() => {
    setValue("cityCode", "", { shouldValidate: false });
    setCitySearch("");
    setCityDropdownOpen(false);
  }, [selectedCountyCode, setValue]);

  useEffect(() => {
    return () => {
      if (avatar.previewUrl) URL.revokeObjectURL(avatar.previewUrl);
      if (identityDocument.previewUrl) URL.revokeObjectURL(identityDocument.previewUrl);
      if (professionalDocument.previewUrl) URL.revokeObjectURL(professionalDocument.previewUrl);
    };
  }, [avatar.previewUrl, identityDocument.previewUrl, professionalDocument.previewUrl]);

  useEffect(() => {
    if (!cityDropdownOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (cityComboRef.current && !cityComboRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [cityDropdownOpen]);

  useEffect(() => {
    if (cityDropdownOpen) {
      queueMicrotask(() => citySearchInputRef.current?.focus());
    }
  }, [cityDropdownOpen]);

  useEffect(() => {
    if (!hasValidEmailForNewsletter || providerUid) {
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
        if (isCancelled) return;
        const isActive = response.data?.isActiveSubscriber === true;
        setIsActiveNewsletterSubscriber(isActive);
        if (isActive) setValue("newsletterOptIn", false);
      } catch {
        if (!isCancelled) {
          setIsActiveNewsletterSubscriber(false);
          setNewsletterStatusError(t("newsletterCheckError"));
        }
      } finally {
        if (!isCancelled) setNewsletterStatusLoading(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [hasValidEmailForNewsletter, locale, normalizedEmail, providerUid, setValue, t]);

  function updateFileSlot(
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<FileSlot>>
  ) {
    setter((previous) => {
      if (previous.previewUrl) URL.revokeObjectURL(previous.previewUrl);
      if (!file) return emptyFileSlot();
      try {
        assertImageFile(file, t("uploadImageInvalid"));
      } catch (error) {
        return {
          ...emptyFileSlot(),
          file,
          status: "error",
          error: error instanceof Error ? error.message : t("uploadImageInvalid"),
        };
      }
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        status: "added",
        storagePath: null,
        error: null,
      };
    });
  }

  async function createProviderAccount() {
    const values = getValues();
    const { confirmPassword, ...formPayload } = values;
    const selectedCity = findRomaniaCity(values.countyCode, values.cityCode);

    if (!selectedCity) {
      onStepChange(2);
      toast.error(t("cityRequired"));
      return false;
    }

    setAccountCreating(true);
    try {
      const res = await axios.post(
        "/api/providers/onboarding",
        {
          ...formPayload,
          city: selectedCity.cityName,
          locale,
        },
        {
          headers: { "x-next-intl-locale": locale },
        }
      );

      const uid = typeof res.data?.uid === "string" ? res.data.uid : null;
      await signInWithEmailAndPassword(getFirebaseAuth(), values.email.trim(), values.password);
      setProviderUid(uid || getFirebaseAuth().currentUser?.uid || null);
      toast.success(t("accountCreated"));
      return true;
    } catch (error: unknown) {
      const ax = error as {
        response?: { data?: { error?: string; code?: string } };
      };
      const data = ax.response?.data;
      const message =
        typeof data?.error === "string" && data.error.length > 0
          ? data.error
          : readCallableError(error, t("toastGenericError"));
      toast.error(message);
      return false;
    } finally {
      setAccountCreating(false);
    }
  }

  async function uploadSlot(
    slot: FileSlot,
    setter: React.Dispatch<React.SetStateAction<FileSlot>>,
    storagePath: string,
    finalize: () => Promise<void>
  ) {
    if (slot.status === "uploaded" && slot.storagePath) return true;
    if (!slot.file) {
      setter((previous) => ({ ...previous, status: "error", error: t("uploadRequired") }));
      return false;
    }

    try {
      assertImageFile(slot.file, t("uploadImageInvalid"));
      setter((previous) => ({ ...previous, status: "uploading", error: null }));
      await uploadBytes(ref(getFirebaseStorage(), storagePath), slot.file, {
        contentType: slot.file.type,
      });
      await finalize();
      setter((previous) => ({
        ...previous,
        status: "uploaded",
        storagePath,
        error: null,
      }));
      return true;
    } catch (error) {
      setter((previous) => ({
        ...previous,
        status: "error",
        error: readCallableError(error, t("uploadFailed")),
      }));
      return false;
    }
  }

  async function ensureAvatarUploaded() {
    const uid = providerUid || getFirebaseAuth().currentUser?.uid;
    if (!uid || !avatar.file) {
      setAvatar((previous) => ({ ...previous, status: "error", error: t("uploadRequired") }));
      return false;
    }
    const storagePath =
      avatar.storagePath || `providers/${uid}/avatar/${sanitizeFileName(avatar.file)}`;
    return uploadSlot(avatar, setAvatar, storagePath, async () => {
      const callable = httpsCallable(getFirebaseFunctions(), "finalizeProviderAvatarUpload");
      await callable({ storagePath });
    });
  }

  async function ensureDocumentUploaded(
    documentType: "identity" | "professional",
    slot: FileSlot,
    setter: React.Dispatch<React.SetStateAction<FileSlot>>
  ) {
    const uid = providerUid || getFirebaseAuth().currentUser?.uid;
    if (!uid || !slot.file) {
      setter((previous) => ({ ...previous, status: "error", error: t("uploadRequired") }));
      return false;
    }
    const storagePath =
      slot.storagePath ||
      `providers/${uid}/documents/${documentType}/${sanitizeFileName(slot.file)}`;
    return uploadSlot(slot, setter, storagePath, async () => {
      const callable = httpsCallable(getFirebaseFunctions(), "finalizeProviderDocumentUpload");
      await callable({
        documentType,
        storagePath,
        originalFileName: slot.file?.name || "document.jpg",
      });
    });
  }

  async function goNextStep() {
    const stepFields: Record<number, Array<keyof FormValues>> = {
      1: ["fullName", "email", "password", "confirmPassword", "phone"],
      2: ["countyCode", "cityCode", "serviceType"],
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

    if (currentStep <= 3) {
      const valid = await trigger(stepFields[currentStep]);
      if (!valid) return;
    }

    if (currentStep === 3 && !providerUid) {
      const created = await createProviderAccount();
      if (!created) return;
    }

    if (currentStep === 4) {
      const uploaded = await ensureAvatarUploaded();
      if (!uploaded) return;
    }

    if (currentStep === 5) {
      const identityUploaded = await ensureDocumentUploaded(
        "identity",
        identityDocument,
        setIdentityDocument
      );
      const professionalUploaded = await ensureDocumentUploaded(
        "professional",
        professionalDocument,
        setProfessionalDocument
      );
      if (!identityUploaded || !professionalUploaded) return;
    }

    onStepChange(Math.min(MAX_STEP, currentStep + 1));
  }

  function goBackStep() {
    onStepChange(Math.max(1, currentStep - 1));
  }

  async function onSubmit() {
    setFinalSubmitting(true);
    setFinalError(null);
    try {
      if (!providerUid && !getFirebaseAuth().currentUser?.uid) {
        throw new Error(t("accountMissing"));
      }
      if (avatar.status !== "uploaded") throw new Error(t("avatarRequired"));
      if (identityDocument.status !== "uploaded" || professionalDocument.status !== "uploaded") {
        throw new Error(t("documentsRequired"));
      }
      const callable = httpsCallable(getFirebaseFunctions(), "submitProviderOnboarding");
      await callable({});
      toast.success(t("toastSuccess"));
      router.push("/providers/onboarding/success");
    } catch (error) {
      const message = readCallableError(error, t("toastGenericError"));
      setFinalError(message);
      toast.error(message);
    } finally {
      setFinalSubmitting(false);
    }
  }

  function renderFilePicker(
    title: string,
    description: string,
    slot: FileSlot,
    setter: React.Dispatch<React.SetStateAction<FileSlot>>
  ) {
    return (
      <div className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            {slot.status === "uploaded" ? (
              <FileCheck2 className="h-5 w-5" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="font-medium text-black dark:text-white">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {slot.previewUrl && (
          <Image
            src={slot.previewUrl}
            alt=""
            width={720}
            height={320}
            unoptimized
            className="mb-3 h-40 w-full rounded-lg object-cover"
          />
        )}

        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(event) => updateFileSlot(event.target.files?.[0] || null, setter)}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />

        <p className="mt-2 text-xs text-muted-foreground">
          {slot.status === "uploaded"
            ? t("uploadStatusUploaded")
            : slot.status === "uploading"
              ? t("uploadStatusUploading")
              : slot.file?.name || t("uploadStatusEmpty")}
        </p>
        {slot.error && <p className="mt-2 text-xs text-red-500">{slot.error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      {currentStep === 1 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputGroup
              label={t("fullNameLabel")}
              placeholder={t("fullNamePh")}
              disabled={Boolean(providerUid)}
              {...register("fullName", { required: t("fullNameRequired") })}
              errorMessages={errors.fullName?.message}
            />
            <InputGroup
              type="email"
              label={t("emailLabel")}
              placeholder={t("emailPh")}
              disabled={Boolean(providerUid)}
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
                  disabled={Boolean(providerUid)}
                  placeholder={t("passwordPh")}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 pr-12 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
                  {...register("password", {
                    required: t("passwordRequired"),
                    minLength: { value: 8, message: t("passwordMin") },
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
                  disabled={Boolean(providerUid)}
                  placeholder={t("confirmPasswordPh")}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 pr-12 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
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
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                disabled={Boolean(providerUid)}
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
            <label htmlFor="provider-county" className="mb-2.5 inline-block text-sm">
              {t("countyLabel")}
            </label>
            <select
              id="provider-county"
              aria-label={t("countyAria")}
              disabled={Boolean(providerUid)}
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
              {...register("countyCode", { required: t("countyRequired") })}
            >
              <option value="">{t("countyPlaceholder")}</option>
              {ROMANIA_COUNTIES.map((county) => (
                <option key={county.code} value={county.code}>
                  {county.name}
                </option>
              ))}
            </select>
            {errors.countyCode?.message && (
              <p className="mt-2 text-xs text-red-500">{errors.countyCode.message}</p>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="provider-city" className="mb-2.5 inline-block text-sm">
              {t("cityLabel")}
            </label>
            <div ref={cityComboRef} className="relative">
              <input
                type="hidden"
                {...register("cityCode", {
                  required: t("cityRequired"),
                  validate: (value) =>
                    Boolean(findRomaniaCity(selectedCountyCode, value)) || t("cityRequired"),
                })}
              />
              <button
                type="button"
                id="provider-city"
                disabled={!selectedCountyCode || Boolean(providerUid)}
                aria-label={t("cityAria")}
                aria-haspopup="listbox"
                aria-expanded={cityDropdownOpen}
                aria-controls="provider-city-listbox"
                onClick={() => {
                  if (!selectedCountyCode || providerUid) return;
                  setCityDropdownOpen((open) => !open);
                }}
                className={cn(
                  "border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary flex w-full items-center justify-between gap-2 rounded-md border bg-white px-6 py-3 text-left text-base font-medium outline-hidden disabled:cursor-not-allowed disabled:opacity-60 dark:bg-black dark:text-white",
                  errors.cityCode && "border-red-500"
                )}
              >
                <span className={selectedCityRecord ? "text-body truncate" : "text-muted-foreground truncate"}>
                  {!selectedCountyCode
                    ? t("cityDisabledPlaceholder")
                    : selectedCityRecord
                      ? selectedCityRecord.cityName
                      : t("cityPlaceholder")}
                </span>
                <ChevronDown
                  className={cn(
                    "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                    cityDropdownOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {cityDropdownOpen && selectedCountyCode ? (
                <div
                  className="border-stroke dark:border-stroke-dark absolute left-0 right-0 z-[100] mt-1 overflow-hidden rounded-md border bg-white shadow-lg dark:bg-black"
                  role="presentation"
                >
                  <input
                    ref={citySearchInputRef}
                    id="provider-city-search"
                    type="search"
                    value={citySearch}
                    onChange={(event) => setCitySearch(event.target.value)}
                    placeholder={t("citySearchPlaceholder")}
                    className="border-stroke text-body focus:border-primary dark:border-stroke-dark w-full border-0 border-b bg-white px-4 py-2.5 text-sm outline-hidden dark:bg-black dark:text-white"
                  />
                  <ul
                    id="provider-city-listbox"
                    role="listbox"
                    className="max-h-60 overflow-y-auto py-1"
                  >
                    {filteredCities.map((city) => (
                      <li key={city.cityCode} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedCityCode === city.cityCode}
                          className="hover:bg-muted/80 dark:hover:bg-muted/20 w-full px-4 py-2.5 text-left text-sm text-body dark:text-white"
                          onClick={() => {
                            setValue("cityCode", city.cityCode, { shouldValidate: true });
                            setCitySearch("");
                            setCityDropdownOpen(false);
                          }}
                        >
                          {city.cityName}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {filteredCities.length === 0 ? (
                    <p className="text-muted-foreground px-4 py-3 text-xs">
                      {t("cityEmpty")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {errors.cityCode?.message && (
              <p className="mt-2 text-xs text-red-500">{errors.cityCode.message}</p>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="provider-service" className="mb-2.5 inline-block text-sm">
              {t("serviceLabel")}
            </label>
            <select
              id="provider-service"
              aria-label={t("serviceAria")}
              disabled={Boolean(providerUid)}
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
              {...register("serviceType", { required: t("serviceRequired") })}
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
              disabled={Boolean(providerUid)}
              className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
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
                  disabled={Boolean(providerUid)}
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
                disabled={Boolean(providerUid)}
                {...register("cui", {
                  validate: (value) =>
                    !isLegalEntityReady || value.trim().length > 1 || t("cuiRequired"),
                })}
                errorMessages={errors.cui?.message}
              />
              <InputGroup
                label={t("tradeRegisterLabel")}
                placeholder={t("tradeRegisterPh")}
                disabled={Boolean(providerUid)}
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
                  disabled={Boolean(providerUid)}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
                  {...register("estimatedSetupTimeline", {
                    validate: (value) =>
                      !isEntityInProgress || value.trim().length > 0 || t("timelineRequired"),
                  })}
                >
                  <option value="">{t("timelinePlaceholder")}</option>
                  <option value="1_2_weeks">{t("timeline1_2_weeks")}</option>
                  <option value="2_4_weeks">{t("timeline2_4_weeks")}</option>
                  <option value="1_2_months">{t("timeline1_2_months")}</option>
                  <option value="over_2_months">{t("timelineOver2")}</option>
                </select>
                {errors.estimatedSetupTimeline?.message && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.estimatedSetupTimeline.message}
                  </p>
                )}
              </fieldset>
              <fieldset>
                <label htmlFor="has-accountant" className="mb-2.5 inline-block text-sm">
                  {t("accountantLabel")}
                </label>
                <select
                  id="has-accountant"
                  aria-label={t("accountantAria")}
                  disabled={Boolean(providerUid)}
                  className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden disabled:opacity-60 dark:bg-black dark:text-white"
                  {...register("hasAccountant")}
                >
                  <option value="unsure">{t("accountantUnsure")}</option>
                  <option value="yes">{t("accountantYes")}</option>
                  <option value="no">{t("accountantNo")}</option>
                </select>
              </fieldset>
            </div>
          )}

          {hasValidEmailForNewsletter && !providerUid && (
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
            name="launchContactConsent"
            render={({ field }) => (
              <Checkbox
                name={field.name}
                checked={field.value}
                disabled={Boolean(providerUid)}
                onChange={(event) => field.onChange(event.target.checked)}
                label={t("launchContactOptIn")}
              />
            )}
          />

          <Controller
            control={control}
            name="acceptTerms"
            rules={{ required: t("termsRequired") }}
            render={({ field, fieldState }) => (
              <div>
                <Checkbox
                  name={field.name}
                  checked={field.value}
                  disabled={Boolean(providerUid)}
                  onChange={(event) => field.onChange(event.target.checked)}
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
          {providerUid && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {t("accountReady")}
            </p>
          )}
        </>
      )}

      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ImagePlus className="text-primary h-5 w-5" />
            <p className="text-sm text-muted-foreground">{t("avatarIntro")}</p>
          </div>
          {renderFilePicker(t("avatarTitle"), t("avatarDescription"), avatar, setAvatar)}
        </div>
      )}

      {currentStep === 5 && (
        <div className="grid gap-4 md:grid-cols-2">
          {renderFilePicker(
            t("identityDocumentTitle"),
            t("identityDocumentDescription"),
            identityDocument,
            setIdentityDocument
          )}
          {renderFilePicker(
            t("professionalDocumentTitle"),
            t("professionalDocumentDescription"),
            professionalDocument,
            setProfessionalDocument
          )}
        </div>
      )}

      {currentStep === 6 && (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">{t("finalReviewIntro")}</p>
          <ul className="space-y-2 text-sm">
            <li>{avatar.status === "uploaded" ? "✓" : "•"} {t("finalAvatar")}</li>
            <li>
              {identityDocument.status === "uploaded" &&
              professionalDocument.status === "uploaded"
                ? "✓"
                : "•"}{" "}
              {t("finalDocuments")}
            </li>
          </ul>
          {finalError && <p className="text-sm text-red-500">{finalError}</p>}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={goBackStep}
          disabled={currentStep === 1 || busy}
          className="border-stroke dark:border-stroke-dark hover:border-primary rounded-md border px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("back")}
        </button>
        {currentStep < MAX_STEP ? (
          <button
            type="button"
            onClick={goNextStep}
            disabled={busy}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {accountCreating ? t("submitting") : t("next")}
          </button>
        ) : (
          <button
            type="submit"
            disabled={busy}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {finalSubmitting ? t("submitting") : t("submitReview")}
          </button>
        )}
      </div>
    </form>
  );
}

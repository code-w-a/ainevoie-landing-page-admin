"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { createSquareAvatarFile } from "@/lib/cropImage";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
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
type AvatarSource = {
  file: File;
  previewUrl: string;
  error: string | null;
};
type EmailStatus = "idle" | "checking" | "available" | "exists" | "error";

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

function buildAvatarUploadPath(uid: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `providers/${uid}/avatar/${Date.now()}-${random}.jpg`;
}

function assertImageFile(file: File, errorMessage: string) {
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
    throw new Error(errorMessage);
  }
}

function readCallableError(error: unknown, fallback: string) {
  const err = error as { message?: string; code?: string; details?: unknown };
  if (typeof err.message === "string" && err.message.trim()) {
    const code = typeof err.code === "string" && err.code.trim() ? err.code.trim() : "";
    return code ? `${err.message} (${code})` : err.message;
  }
  return fallback;
}

function revokeTrackedPreviewUrl(ref: React.MutableRefObject<string | null>) {
  if (!ref.current) return;
  URL.revokeObjectURL(ref.current);
  ref.current = null;
}

function createTrackedPreviewUrl(file: File, ref: React.MutableRefObject<string | null>) {
  revokeTrackedPreviewUrl(ref);
  const previewUrl = URL.createObjectURL(file);
  ref.current = previewUrl;
  return previewUrl;
}

function logOnboardingClient(event: string, details?: Record<string, unknown>) {
  console.info(`[provider-onboarding] ${event}`, details || {});
}

function serializeOnboardingError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { value: String(error) };
  }

  const record = error as Record<string, unknown>;
  const serialized: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(error)) {
    serialized[key] = record[key];
  }

  const known = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    details?: unknown;
    customData?: unknown;
    stack?: unknown;
  };

  return {
    name: typeof known.name === "string" ? known.name : serialized.name,
    message: typeof known.message === "string" ? known.message : serialized.message,
    code: typeof known.code === "string" ? known.code : serialized.code,
    details: known.details ?? serialized.details ?? null,
    customData: known.customData ?? serialized.customData ?? null,
    stack: typeof known.stack === "string" ? known.stack : serialized.stack,
    properties: serialized,
  };
}

function logOnboardingClientError(event: string, error: unknown, details?: Record<string, unknown>) {
  console.error(`[provider-onboarding] ${event}`, {
    ...details,
    error: serializeOnboardingError(error),
  }, error);
}

function isSlotReadyForSubmit(slot: FileSlot) {
  return slot.status === "uploaded" || Boolean(slot.file);
}

export default function ProviderOnboardingFormWizard({
  currentStep,
  onStepChange,
}: ProviderOnboardingFormWizardProps) {
  const t = useTranslations("ProviderWizard");
  const apiErrors = useTranslations("ApiErrors");
  const locale = useLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailStatusCheckedValue, setEmailStatusCheckedValue] = useState("");
  const [providerUid, setProviderUid] = useState<string | null>(null);
  const [accountCreating, setAccountCreating] = useState(false);
  const [avatarSource, setAvatarSource] = useState<AvatarSource | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<Area | null>(null);
  const [avatarCropping, setAvatarCropping] = useState(false);
  const [avatar, setAvatar] = useState<FileSlot>(() => emptyFileSlot());
  const [identityDocument, setIdentityDocument] = useState<FileSlot>(() => emptyFileSlot());
  const [professionalDocument, setProfessionalDocument] = useState<FileSlot>(() => emptyFileSlot());
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);
  const cityComboRef = useRef<HTMLDivElement>(null);
  const citySearchInputRef = useRef<HTMLInputElement>(null);
  const avatarSourcePreviewUrlRef = useRef<string | null>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);
  const identityPreviewUrlRef = useRef<string | null>(null);
  const professionalPreviewUrlRef = useRef<string | null>(null);

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
  const fullNameValue = watch("fullName");
  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirmPassword");
  const phoneValue = watch("phone");
  const acceptTerms = watch("acceptTerms");
  const legalStatus = watch("legalStatus");
  const companyNameValue = watch("companyName");
  const cuiValue = watch("cui");
  const estimatedSetupTimelineValue = watch("estimatedSetupTimeline");
  const selectedCountyCode = watch("countyCode");
  const selectedCityCode = watch("cityCode");
  const selectedServiceType = watch("serviceType");
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
  const emailCheckBlocksStep =
    currentStep === 1 &&
    hasValidEmailForNewsletter &&
    (emailStatus === "checking" ||
      (emailStatus === "exists" && emailStatusCheckedValue === normalizedEmail));
  const nextDisabled =
    busy || emailCheckBlocksStep || (currentStep === 3 && !acceptTerms);
  const contactComplete =
    Boolean(fullNameValue?.trim()) &&
    hasValidEmailForNewsletter &&
    Boolean(phoneValue?.trim()) &&
    Boolean(passwordValue) &&
    passwordValue.length >= 8 &&
    passwordValue === confirmPasswordValue;
  const servicesComplete =
    Boolean(selectedCountyCode) &&
    Boolean(selectedCityRecord) &&
    Boolean(
      PROVIDER_SERVICE_ENTRIES.some((entry) => entry.value === selectedServiceType)
    );
  const legalComplete =
    Boolean(legalStatus) &&
    (!isLegalEntityReady ||
      (Boolean(companyNameValue?.trim()) && Boolean(cuiValue?.trim()))) &&
    (!isEntityInProgress || Boolean(estimatedSetupTimelineValue?.trim())) &&
    acceptTerms;
  const avatarComplete = isSlotReadyForSubmit(avatar) && avatar.status !== "error";
  const documentsComplete =
    isSlotReadyForSubmit(identityDocument) &&
    isSlotReadyForSubmit(professionalDocument) &&
    identityDocument.status !== "error" &&
    professionalDocument.status !== "error";
  const finalChecklist = [
    { key: "contact", label: t("finalContact"), complete: contactComplete },
    { key: "services", label: t("finalServices"), complete: servicesComplete },
    { key: "confirmation", label: t("finalConfirmation"), complete: legalComplete },
    { key: "avatar", label: t("finalAvatar"), complete: avatarComplete },
    { key: "documents", label: t("finalDocuments"), complete: documentsComplete },
  ];
  const finalChecklistComplete = finalChecklist.every((item) => item.complete);
  const checkProviderEmailStatus = useCallback(
    async (email: string) => {
      const response = await axios.get<{ exists?: boolean; source?: "provider" | "auth" }>(
        "/api/providers/onboarding/email-status",
        {
          params: { email },
          headers: { "x-next-intl-locale": locale },
        }
      );
      return response.data;
    },
    [locale]
  );

  useEffect(() => {
    setValue("cityCode", "", { shouldValidate: false });
    setCitySearch("");
    setCityDropdownOpen(false);
  }, [selectedCountyCode, setValue]);

  useEffect(() => {
    return () => {
      revokeTrackedPreviewUrl(avatarSourcePreviewUrlRef);
      revokeTrackedPreviewUrl(avatarPreviewUrlRef);
      revokeTrackedPreviewUrl(identityPreviewUrlRef);
      revokeTrackedPreviewUrl(professionalPreviewUrlRef);
    };
  }, []);

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
      setEmailStatus("idle");
      setEmailStatusCheckedValue("");
      return;
    }

    setEmailStatus("checking");
    const checkedEmail = normalizedEmail;
    let cancelled = false;
    const timerId = window.setTimeout(async () => {
      try {
        const result = await checkProviderEmailStatus(checkedEmail);
        if (cancelled) return;
        setEmailStatus(result.exists ? "exists" : "available");
        setEmailStatusCheckedValue(checkedEmail);
      } catch (error) {
        if (cancelled) return;
        logOnboardingClientError("email status check failed", error, {
          emailDomain: checkedEmail.split("@").pop() || null,
        });
        setEmailStatus("error");
        setEmailStatusCheckedValue(checkedEmail);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [checkProviderEmailStatus, hasValidEmailForNewsletter, normalizedEmail, providerUid]);

  function updateFileSlot(
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<FileSlot>>,
    previewUrlRef: React.MutableRefObject<string | null>
  ) {
    revokeTrackedPreviewUrl(previewUrlRef);

    if (!file) {
      setter(emptyFileSlot());
      return;
    }

    try {
      assertImageFile(file, t("uploadImageInvalid"));
    } catch (error) {
      setter({
        ...emptyFileSlot(),
        file,
        status: "error",
        error: error instanceof Error ? error.message : t("uploadImageInvalid"),
      });
      return;
    }

    setter({
      file,
      previewUrl: createTrackedPreviewUrl(file, previewUrlRef),
      status: "added",
      storagePath: null,
      error: null,
    });
  }

  function updateAvatarSource(file: File | null) {
    revokeTrackedPreviewUrl(avatarSourcePreviewUrlRef);
    revokeTrackedPreviewUrl(avatarPreviewUrlRef);

    if (!file) {
      setAvatarSource(null);
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setAvatarCroppedAreaPixels(null);
      setAvatar(emptyFileSlot());
      return;
    }

    try {
      assertImageFile(file, t("uploadImageInvalid"));
      setAvatarSource({
        file,
        previewUrl: createTrackedPreviewUrl(file, avatarSourcePreviewUrlRef),
        error: null,
      });
    } catch (error) {
      setAvatarSource({
        file,
        previewUrl: "",
        error: error instanceof Error ? error.message : t("uploadImageInvalid"),
      });
    }
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedAreaPixels(null);
    setAvatar(emptyFileSlot());
  }

  async function confirmAvatarCrop() {
    if (!avatarSource?.previewUrl || !avatarCroppedAreaPixels) {
      setAvatar((previous) => ({ ...previous, status: "error", error: t("avatarCropRequired") }));
      return;
    }

    setAvatarCropping(true);
    logOnboardingClient("avatar crop started", {
      sourceFileName: avatarSource.file.name,
      sourceFileSize: avatarSource.file.size,
      croppedAreaPixels: avatarCroppedAreaPixels,
    });
    try {
      const file = await createSquareAvatarFile(
        avatarSource.previewUrl,
        avatarCroppedAreaPixels,
        "provider-avatar.jpg"
      );
      setAvatar({
        file,
        previewUrl: createTrackedPreviewUrl(file, avatarPreviewUrlRef),
        status: "added",
        storagePath: null,
        error: null,
      });
      logOnboardingClient("avatar crop ready", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    } catch (error) {
      logOnboardingClientError("avatar crop failed", error);
      setAvatar((previous) => ({
        ...previous,
        status: "error",
        error: error instanceof Error ? error.message : t("avatarCropFailed"),
      }));
    } finally {
      setAvatarCropping(false);
    }
  }

  async function createProviderAccount({ showToast = true } = {}) {
    const values = getValues();
    const { confirmPassword, ...formPayload } = values;
    const selectedCity = findRomaniaCity(values.countyCode, values.cityCode);

    if (!selectedCity) {
      onStepChange(2);
      toast.error(t("cityRequired"));
      return false;
    }

    setAccountCreating(true);
    logOnboardingClient("account create request started", {
      locale,
      emailDomain: values.email.includes("@") ? values.email.split("@").pop()?.toLowerCase() : null,
      countyCode: values.countyCode,
      cityCode: values.cityCode,
      serviceType: values.serviceType,
      legalStatus: values.legalStatus,
      newsletterOptIn: values.newsletterOptIn,
      launchContactConsent: values.launchContactConsent,
    });
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
      logOnboardingClient("account create request completed", {
        uid: uid || getFirebaseAuth().currentUser?.uid || null,
        welcomeEmailSent: res.data?.welcomeEmailSent === true,
        newsletterStatusAtSignup: res.data?.newsletterStatusAtSignup || null,
      });
      if (showToast) {
        toast.success(t("accountCreated"));
      }
      return true;
    } catch (error: unknown) {
      logOnboardingClientError("account create request failed", error, {
        status: (error as { response?: { status?: number } }).response?.status || null,
        code:
          (error as { response?: { data?: { code?: string } } }).response?.data?.code || null,
      });
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
    label: string,
    slot: FileSlot,
    setter: React.Dispatch<React.SetStateAction<FileSlot>>,
    storagePath: string,
    finalize: () => Promise<string | void>
  ) {
    if (slot.status === "uploaded" && slot.storagePath) return slot.storagePath;
    if (!slot.file) {
      setter((previous) => ({ ...previous, status: "error", error: t("uploadRequired") }));
      logOnboardingClient("upload missing file", { label, storagePath });
      return null;
    }

    try {
      assertImageFile(slot.file, t("uploadImageInvalid"));
      setter((previous) => ({ ...previous, status: "uploading", error: null }));
      logOnboardingClient("storage upload started", {
        label,
        storagePath,
        fileName: slot.file.name,
        fileSize: slot.file.size,
        fileType: slot.file.type,
      });
      await uploadBytes(ref(getFirebaseStorage(), storagePath), slot.file, {
        contentType: slot.file.type,
      });
      logOnboardingClient("storage upload completed", { label, storagePath });
      const finalizedPath = await finalize();
      logOnboardingClient("firebase finalize completed", {
        label,
        storagePath,
        finalizedPath: finalizedPath || storagePath,
      });
      setter((previous) => ({
        ...previous,
        status: "uploaded",
        storagePath: finalizedPath || storagePath,
        error: null,
      }));
      return finalizedPath || storagePath;
    } catch (error) {
      logOnboardingClientError("upload/finalize failed", error, { label, storagePath });
      setter((previous) => ({
        ...previous,
        status: "error",
        error: readCallableError(error, t("uploadFailed")),
      }));
      return null;
    }
  }

  async function ensureAvatarUploaded() {
    const uid = providerUid || getFirebaseAuth().currentUser?.uid;
    if (!uid || !avatar.file) {
      setAvatar((previous) => ({ ...previous, status: "error", error: t("uploadRequired") }));
      logOnboardingClient("avatar upload blocked", {
        hasUid: Boolean(uid),
        hasFile: Boolean(avatar.file),
      });
      return null;
    }
    const storagePath = avatar.storagePath || buildAvatarUploadPath(uid);
    return uploadSlot("avatar", avatar, setAvatar, storagePath, async () => {
      const callable = httpsCallable<
        { storagePath: string },
        { avatarPath?: string; status?: string; storagePath?: string }
      >(getFirebaseFunctions(), "finalizeProviderAvatarUpload");
      const result = await callable({ storagePath });
      return result.data.avatarPath || result.data.storagePath;
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
      logOnboardingClient("document upload blocked", {
        documentType,
        hasUid: Boolean(uid),
        hasFile: Boolean(slot.file),
      });
      return null;
    }
    const storagePath =
      slot.storagePath ||
      `providers/${uid}/documents/${documentType}/${sanitizeFileName(slot.file)}`;
    return uploadSlot(documentType, slot, setter, storagePath, async () => {
      const callable = httpsCallable(getFirebaseFunctions(), "finalizeProviderDocumentUpload");
      await callable({
        documentType,
        storagePath,
        originalFileName: slot.file?.name || "document.jpg",
      });
    });
  }

  async function goNextStep() {
    logOnboardingClient("next step requested", {
      currentStep,
      hasProviderUid: Boolean(providerUid),
      avatarStatus: avatar.status,
      identityDocumentStatus: identityDocument.status,
      professionalDocumentStatus: professionalDocument.status,
    });
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
      if (!valid) {
        logOnboardingClient("step validation failed", { currentStep });
        return;
      }
    }

    if (currentStep === 1) {
      if (!hasValidEmailForNewsletter) return;
      setEmailStatus("checking");
      try {
        const result = await checkProviderEmailStatus(normalizedEmail);
        setEmailStatus(result.exists ? "exists" : "available");
        setEmailStatusCheckedValue(normalizedEmail);
        if (result.exists) {
          logOnboardingClient("step blocked by existing email", {
            emailDomain: normalizedEmail.split("@").pop() || null,
            source: result.source || null,
          });
          return;
        }
      } catch (error) {
        logOnboardingClientError("email status check failed on step advance", error, {
          emailDomain: normalizedEmail.split("@").pop() || null,
        });
        setEmailStatus("error");
        setEmailStatusCheckedValue(normalizedEmail);
        toast.error(t("emailCheckFailed"));
        return;
      }
    }

    if (currentStep === 4) {
      if (!avatar.file && avatar.status !== "uploaded") {
        setAvatar((previous) => ({ ...previous, status: "error", error: t("avatarRequired") }));
        logOnboardingClient("avatar local validation failed", {
          hasFile: Boolean(avatar.file),
          status: avatar.status,
        });
        return;
      }
      if (avatar.status === "error") {
        logOnboardingClient("avatar local validation blocked by error", {
          error: avatar.error,
        });
        return;
      }
      logOnboardingClient("avatar local validation passed", {
        status: avatar.status,
        fileName: avatar.file?.name || null,
      });
    }

    if (currentStep === 5) {
      let documentsReady = true;
      if (!identityDocument.file && identityDocument.status !== "uploaded") {
        documentsReady = false;
        setIdentityDocument((previous) => ({
          ...previous,
          status: "error",
          error: t("uploadRequired"),
        }));
      }
      if (!professionalDocument.file && professionalDocument.status !== "uploaded") {
        documentsReady = false;
        setProfessionalDocument((previous) => ({
          ...previous,
          status: "error",
          error: t("uploadRequired"),
        }));
      }
      if (identityDocument.status === "error" || professionalDocument.status === "error") {
        documentsReady = false;
      }
      logOnboardingClient(
        documentsReady
          ? "documents local validation passed"
          : "documents local validation failed",
        {
          identityStatus: identityDocument.status,
          identityHasFile: Boolean(identityDocument.file),
          professionalStatus: professionalDocument.status,
          professionalHasFile: Boolean(professionalDocument.file),
        }
      );
      if (!documentsReady) return;
    }

    const nextStep = Math.min(MAX_STEP, currentStep + 1);
    logOnboardingClient("step advanced", { fromStep: currentStep, toStep: nextStep });
    onStepChange(nextStep);
  }

  function goBackStep() {
    const previousStep = Math.max(1, currentStep - 1);
    logOnboardingClient("back step requested", { fromStep: currentStep, toStep: previousStep });
    onStepChange(previousStep);
  }

  async function onSubmit() {
    setFinalSubmitting(true);
    setFinalError(null);
    logOnboardingClient("final submit started", {
      hasProviderUid: Boolean(providerUid || getFirebaseAuth().currentUser?.uid),
      avatarStatus: avatar.status,
      identityDocumentStatus: identityDocument.status,
      professionalDocumentStatus: professionalDocument.status,
    });
    try {
      const valid = await trigger([
        "fullName",
        "email",
        "password",
        "confirmPassword",
        "phone",
        "countyCode",
        "cityCode",
        "serviceType",
        "legalStatus",
        "companyName",
        "cui",
        "tradeRegisterNumber",
        "estimatedSetupTimeline",
        "hasAccountant",
        "acceptTerms",
      ]);
      if (!valid) {
        onStepChange(1);
        throw new Error(t("toastGenericError"));
      }
      if (!providerUid && !getFirebaseAuth().currentUser?.uid) {
        const created = await createProviderAccount({ showToast: false });
        if (!created) return;
      }
      if (!isSlotReadyForSubmit(avatar)) throw new Error(t("avatarRequired"));
      if (
        !isSlotReadyForSubmit(identityDocument) ||
        !isSlotReadyForSubmit(professionalDocument)
      ) {
        throw new Error(t("documentsRequired"));
      }

      logOnboardingClient("final uploads started", {
        avatarStatus: avatar.status,
        identityDocumentStatus: identityDocument.status,
        professionalDocumentStatus: professionalDocument.status,
      });
      const avatarPath = await ensureAvatarUploaded();
      if (!avatarPath) {
        setFinalError(t("uploadFailed"));
        toast.error(t("uploadFailed"));
        return;
      }
      const identityDocumentPath = await ensureDocumentUploaded(
        "identity",
        identityDocument,
        setIdentityDocument
      );
      const professionalDocumentPath = await ensureDocumentUploaded(
        "professional",
        professionalDocument,
        setProfessionalDocument
      );
      if (!identityDocumentPath || !professionalDocumentPath) {
        setFinalError(t("uploadFailed"));
        toast.error(t("uploadFailed"));
        return;
      }

      const uid = providerUid || getFirebaseAuth().currentUser?.uid || null;
      const submitPayloadSummary = {
        uid,
        hasAvatarPath: Boolean(avatarPath),
        hasIdentityDocumentPath: Boolean(identityDocumentPath),
        hasProfessionalDocumentPath: Boolean(professionalDocumentPath),
      };

      logOnboardingClient("pre-registration uploads finalized", submitPayloadSummary);
      logOnboardingClient("final submit completed");
      toast.success(t("toastSuccess"));
      router.push("/providers/onboarding/success");
    } catch (error) {
      logOnboardingClientError("final submit failed", error);
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
    setter: React.Dispatch<React.SetStateAction<FileSlot>>,
    previewUrlRef: React.MutableRefObject<string | null>
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
          onChange={(event) =>
            updateFileSlot(event.target.files?.[0] || null, setter, previewUrlRef)
          }
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />

        <p className="mt-2 text-xs text-muted-foreground">
          {slot.status === "uploaded"
            ? t("uploadStatusUploaded")
            : slot.status === "uploading"
              ? t("uploadStatusUploading")
              : slot.file
                ? t("uploadStatusReady")
                : t("uploadStatusEmpty")}
        </p>
        {slot.error && <p className="mt-2 text-xs text-red-500">{slot.error}</p>}
      </div>
    );
  }

  function renderAvatarPicker() {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              {avatar.status === "uploaded" ? (
                <FileCheck2 className="h-5 w-5" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="font-medium text-black dark:text-white">{t("avatarTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("avatarDescription")}</p>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            disabled={busy || avatarCropping}
            onChange={(event) => {
              updateAvatarSource(event.target.files?.[0] || null);
              event.currentTarget.value = "";
            }}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          {avatarSource?.error && (
            <p className="mt-2 text-xs text-red-500">{avatarSource.error}</p>
          )}
        </div>

        {avatarSource?.previewUrl ? (
          <div className="rounded-xl border border-border p-4">
            <div className="mb-3">
              <p className="font-medium text-black dark:text-white">{t("avatarCropTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("avatarCropDescription")}</p>
            </div>
            <div className="relative h-72 overflow-hidden rounded-lg bg-black sm:h-80">
              <Cropper
                image={avatarSource.previewUrl}
                crop={avatarCrop}
                zoom={avatarZoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setAvatarCrop}
                onZoomChange={setAvatarZoom}
                onCropComplete={(_, croppedAreaPixels) =>
                  setAvatarCroppedAreaPixels(croppedAreaPixels)
                }
              />
            </div>
            <label htmlFor="avatar-zoom" className="mt-4 block text-sm font-medium">
              {t("avatarCropZoom")}
            </label>
            <input
              id="avatar-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={avatarZoom}
              disabled={busy || avatarCropping}
              onChange={(event) => setAvatarZoom(Number(event.target.value))}
              className="mt-2 w-full accent-primary"
            />
            <button
              type="button"
              disabled={busy || avatarCropping || !avatarCroppedAreaPixels}
              onClick={confirmAvatarCrop}
              className="bg-primary hover:bg-primary/90 mt-4 rounded-md px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {avatarCropping ? t("avatarCropping") : t("avatarCropConfirm")}
            </button>
          </div>
        ) : null}

        {avatar.previewUrl ? (
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-medium text-black dark:text-white">
              {t("avatarCropReady")}
            </p>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                {t("avatarCropPreviewCircle")}
              </p>
              <Image
                src={avatar.previewUrl}
                alt=""
                width={176}
                height={176}
                unoptimized
                className="size-44 rounded-2xl object-cover"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {avatar.status === "uploaded"
                ? t("uploadStatusUploaded")
                : avatar.status === "uploading"
                  ? t("uploadStatusUploading")
                  : avatar.file
                    ? t("uploadStatusReady")
                    : t("uploadStatusEmpty")}
            </p>
            {avatar.error && <p className="mt-2 text-xs text-red-500">{avatar.error}</p>}
          </div>
        ) : avatar.error ? (
          <p className="text-xs text-red-500">{avatar.error}</p>
        ) : null}
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
              errorMessages={
                errors.email?.message ||
                (emailStatus === "exists" && emailStatusCheckedValue === normalizedEmail
                  ? apiErrors("PROVIDER_EMAIL_EXISTS")
                  : undefined)
              }
            />
            {hasValidEmailForNewsletter && emailStatus === "checking" && (
              <p className="-mt-2 text-xs text-muted-foreground md:col-start-2">
                {t("emailChecking")}
              </p>
            )}
            {hasValidEmailForNewsletter && emailStatus === "error" && (
              <p className="-mt-2 text-xs text-muted-foreground md:col-start-2">
                {t("emailCheckFailed")}
              </p>
            )}
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
          {renderAvatarPicker()}
        </div>
      )}

      {currentStep === 5 && (
        <div className="grid gap-4 md:grid-cols-2">
          {renderFilePicker(
            t("identityDocumentTitle"),
            t("identityDocumentDescription"),
            identityDocument,
            setIdentityDocument,
            identityPreviewUrlRef
          )}
          {renderFilePicker(
            t("professionalDocumentTitle"),
            t("professionalDocumentDescription"),
            professionalDocument,
            setProfessionalDocument,
            professionalPreviewUrlRef
          )}
        </div>
      )}

      {currentStep === 6 && (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">{t("finalReviewIntro")}</p>
          <ul className="space-y-2 text-sm">
            {finalChecklist.map((item) => (
              <li
                key={item.key}
                className={item.complete ? "text-emerald-700" : "text-muted-foreground"}
              >
                <span className="font-medium">{item.complete ? "✓" : "•"}</span>{" "}
                {item.label}
              </li>
            ))}
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
            disabled={nextDisabled}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {accountCreating ? t("submitting") : t("next")}
          </button>
        ) : (
          <button
            type="submit"
            disabled={busy || !finalChecklistComplete}
            className="bg-primary hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {finalSubmitting ? t("submitting") : t("submitReview")}
          </button>
        )}
      </div>
    </form>
  );
}

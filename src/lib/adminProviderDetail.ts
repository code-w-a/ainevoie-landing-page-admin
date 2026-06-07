import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import {
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  providerLegalStatusLabel,
  providerStatusVariant,
} from "@/lib/providers";

export type ReviewAction = "approve" | "reject" | "suspend" | "reinstate";

export type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "danger";

export type ChecklistState = "complete" | "missing" | "review";

export type ProviderDocumentType = "identity" | "professional";

export type ProviderDocumentFile = {
  status?: string | null;
  storagePath?: string | null;
  originalFileName?: string | null;
  uploadedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewReason?: string | null;
};

export type ProviderChecklistItem = {
  title: string;
  detail: string;
  state: ChecklistState;
  badge: string;
};

export type ProviderDocument = {
  uid?: string;
  id?: string;
  status?: string;
  accountStatus?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  authProviders?: string[];
  locale?: string | null;
  professionalProfile?: {
    businessName?: string | null;
    displayName?: string | null;
    specialization?: string | null;
    baseRateAmount?: number | null;
    baseRateCurrency?: string | null;
    coverageAreaText?: string | null;
    availabilitySummary?: string | null;
    shortBio?: string | null;
    avatarPath?: string | null;
    coverageArea?: Record<string, unknown> | null;
  } | null;
  payoutDetails?: {
    iban?: string | null;
    accountHolderName?: string | null;
    bankName?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
  } | null;
  documents?: {
    identity?: ProviderDocumentFile | null;
    professional?: ProviderDocumentFile | null;
  } | null;
  reviewState?: {
    submittedAt?: string | null;
    lastReviewedAt?: string | null;
  } | null;
  adminReview?: {
    reviewedBy?: string | null;
    action?: string | null;
    reason?: string | null;
    reviewedAt?: string | null;
  } | null;
  suspension?: {
    reason?: string | null;
    suspendedBy?: string | null;
    suspendedAt?: string | null;
  } | null;
  lastPublishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  fullName?: string;
  phone?: string;
  city?: string;
  cityCode?: string;
  cityName?: string;
  countyCode?: string;
  countyName?: string;
  coverageAreaText?: string | null;
  serviceType?: string;
  legalStatus?: keyof typeof providerLegalStatusLabel;
  companyName?: string | null;
  cui?: string | null;
  tradeRegisterNumber?: string | null;
  estimatedSetupTimeline?: string | null;
  hasAccountant?: "yes" | "no" | "unsure" | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyVersion?: string | null;
  launchContactConsent?: boolean;
  launchContactConsentAt?: string | null;
  launchContactConsentVersion?: string | null;
  onboardingStatus?: string;
  source?: string | null;
  internalNotes?: string;
};

export type ProviderCase = {
  provider?: ProviderDocument | null;
  providerDirectory?: Record<string, unknown> | null;
  availability?: Record<string, unknown> | null;
  services?: Array<Record<string, unknown>>;
  recentBookings?: Array<Record<string, unknown>>;
  recentAuditEvents?: Array<Record<string, unknown>>;
  item?: ProviderDocument | null;
};

export type ReviewResult = {
  providerId?: string | null;
  status?: string | null;
};

export type ProviderServiceItem = {
  serviceId: string;
  name: string;
  categoryLabel: string;
  status: string;
  baseRateAmount: number | null;
  baseRateCurrency: string;
  estimatedDurationMinutes: number | null;
  maxProfessionals: number | null;
};

export type ProviderAvailabilityRange = {
  id: string;
  startTime: string;
  endTime: string;
};

export type ProviderAvailabilityDay = {
  dayKey: string;
  label: string;
  isEnabled: boolean;
  timeRanges: ProviderAvailabilityRange[];
};

export type ProviderBlockedDate = {
  id: string;
  dateKey: string;
};

export type TimelineEvent = {
  id: string;
  title: string;
  at?: string | null;
  actor?: string | null;
  description?: string | null;
};

export type ProviderApprovalSummary = {
  canApprove: boolean;
  headline: string;
  missingItems: string[];
  nextAction: string;
  technicalReasons: string[];
};

export const actionMeta: Record<
  ReviewAction,
  { label: string; title: string; description: string; destructive?: boolean }
> = {
  approve: {
    label: "Aprobă",
    title: "Aprobă prestatorul",
    description: "Confirmă aprobarea acestui prestator.",
  },
  reject: {
    label: "Respinge",
    title: "Respinge prestatorul",
    description: "Adaugă un motiv scurt pentru decizie.",
    destructive: true,
  },
  suspend: {
    label: "Suspendă",
    title: "Suspendă prestatorul",
    description: "Adaugă un motiv scurt pentru suspendare.",
    destructive: true,
  },
  reinstate: {
    label: "Reactivează",
    title: "Reactivează prestatorul",
    description: "Confirmă reactivarea acestui prestator.",
  },
};

export const reviewActionLabel: Record<string, string> = {
  approve: "Aprobat",
  reject: "Respins",
  suspend: "Suspendat",
  reinstate: "Reactivat",
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  active: "Activ",
  draft: "Ciornă",
  inactive: "Inactiv",
  archived: "Arhivat",
};

export const SUPERADMIN_EMAIL = "superadmin@ainevoie.ro";
export const DRIFT_SPECIALIZATION_ISSUE = "Categoria principală diferă între profil și aplicație.";

export const checklistStateMeta: Record<
  ChecklistState,
  { label: string; variant: BadgeVariant; iconClassName: string }
> = {
  complete: {
    label: "Complet",
    variant: "success",
    iconClassName: "text-emerald-600",
  },
  missing: {
    label: "Lipsă",
    variant: "warning",
    iconClassName: "text-amber-600",
  },
  review: {
    label: "Necesită verificare",
    variant: "warning",
    iconClassName: "text-amber-600",
  },
};

const APPROVAL_REASON_UX: Record<string, string> = {
  "profil profesional incomplet": "Profilul public nu este complet",
  "poza de profil lipsește": "Lipsește poza de profil",
  "act de identitate lipsă": "Documentul de identitate lipsește",
  "document profesional/firmă lipsă": "Documentul profesional lipsește",
  "disponibilitate neconfigurată": "Programul nu este configurat",
  "serviciu principal/serviciu activ lipsă": "Nu există servicii active",
  "serviciu activ incomplet (lipsește nume, descriere, categorie sau tarif)":
    "Un serviciu activ are date incomplete",
};

const ACTIVITY_LABEL_MAP: Record<string, string> = {
  "booking.created": "Programare creată",
  "booking.confirmed": "Programare confirmată",
  "booking.rejected": "Programare respinsă",
  "booking.cancelled": "Programare anulată",
  "booking.completed": "Programare finalizată",
  "payment.succeeded": "Plată înregistrată",
  "payment.failed": "Plată eșuată",
  "payment.synced": "Plată sincronizată",
  "provider.review": "Decizie admin",
  "provider.submit": "Trimis la verificare",
  "provider.submit_for_review": "Trimis la verificare",
  "account.delete": "Cont șters",
};

export function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getProviderFromCase(data: ProviderCase | null) {
  return data?.provider || data?.item || null;
}

export function getProviderId(provider: ProviderDocument | null, fallback?: string) {
  return provider?.uid || provider?.id || fallback || "";
}

export function getDisplayName(provider: ProviderDocument) {
  return (
    provider.professionalProfile?.displayName ||
    provider.professionalProfile?.businessName ||
    provider.fullName ||
    provider.email ||
    "-"
  );
}

export function getStatus(provider: ProviderDocument) {
  return provider.status || provider.onboardingStatus || "pre_registered";
}

export function getSimplifiedStatusLabel(status?: string | null) {
  const normalized = readString(status);
  if (normalized === "approved") return "Aprobat";
  if (normalized === "rejected") return "Respins";
  if (normalized === "suspended") return "Suspendat";
  if (
    normalized === "pending_review" ||
    normalized === "in_review" ||
    normalized === "pre_registered" ||
    normalized === "new"
  ) {
    return "În așteptare";
  }
  return normalized || "În așteptare";
}

export function getSimplifiedStatusVariant(status?: string | null): BadgeVariant {
  const normalized = readString(status);
  if (normalized === "approved") return "success";
  if (normalized === "rejected" || normalized === "suspended") return "danger";
  if (
    normalized === "pending_review" ||
    normalized === "in_review" ||
    normalized === "pre_registered" ||
    normalized === "new"
  ) {
    return "warning";
  }
  return providerStatusVariant(status) as BadgeVariant;
}

export function getDocumentMeta(doc?: ProviderDocumentFile | null) {
  const status = readString(doc?.status);
  const hasFile = Boolean(doc?.storagePath);
  if (
    hasFile &&
    (status === "uploaded" ||
      status === "approved" ||
      status === "pending" ||
      status === "submitted")
  ) {
    return { label: "Încărcat", ok: true, variant: "success" as const };
  }
  return { label: "Lipsă", ok: false, variant: "outline" as const };
}

export function getVerificationIssueCount(checklist: ProviderChecklistItem[]) {
  return checklist.filter((item) => item.state !== "complete").length;
}

export function shouldShowPublicSyncBanner(status: string, hasDrift: boolean) {
  if (!hasDrift) {
    return false;
  }
  return ["approved", "pending_review", "in_review"].includes(readString(status));
}

export function canViewProviderDocument(doc?: ProviderDocumentFile | null) {
  return Boolean(doc?.storagePath);
}

export function getDocumentDisplayName(doc?: ProviderDocumentFile | null) {
  if (doc?.originalFileName) {
    return doc.originalFileName;
  }
  if (doc?.storagePath) {
    return "Fișier încărcat";
  }
  return "Nu există informații";
}

export function hasConfiguredAvailability(
  provider: ProviderDocument,
  availability?: Record<string, unknown> | null
) {
  if (provider.professionalProfile?.availabilitySummary) {
    return true;
  }
  if (!availability || typeof availability !== "object") {
    return false;
  }
  if (availability.hasConfiguredAvailability === true || availability.configured === true) {
    return true;
  }
  const weekSchedule = availability.weekSchedule;
  if (!weekSchedule || typeof weekSchedule !== "object") {
    return false;
  }
  return Object.values(weekSchedule).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object" && "slots" in value) {
      return Array.isArray((value as { slots?: unknown[] }).slots) && Boolean((value as { slots?: unknown[] }).slots?.length);
    }
    return false;
  });
}

export function formatValue(value: unknown, fallback = "Nu este completat") {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "Da" : "Nu";
  }
  return fallback;
}

export function formatCompactValue(value: unknown) {
  return formatValue(value, "-");
}

export function formatCurrency(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") {
    return "Nu este completat";
  }
  return `${amount} ${currency || "RON"}`;
}

export function formatReviewAction(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }
  return reviewActionLabel[value] || value;
}

export function humanizeApprovalReason(reason: string) {
  return APPROVAL_REASON_UX[reason] || reason;
}

export function formatAdminActivityLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Activitate prestator";
  }
  const cleaned = value.trim();
  if (ACTIVITY_LABEL_MAP[cleaned]) {
    return ACTIVITY_LABEL_MAP[cleaned];
  }
  if (cleaned.startsWith("payment.") || cleaned.includes("stripe") || cleaned.includes("webhook")) {
    return "Plată înregistrată";
  }
  if (cleaned.startsWith("booking.")) {
    const suffix = cleaned.replace("booking.", "");
    return ACTIVITY_LABEL_MAP[`booking.${suffix}`] || "Programare actualizată";
  }
  const withoutPrefix = cleaned.replace(/^provider\./, "");
  if (ACTIVITY_LABEL_MAP[`provider.${withoutPrefix}`]) {
    return ACTIVITY_LABEL_MAP[`provider.${withoutPrefix}`];
  }
  const normalized = withoutPrefix.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  if (normalized === "submit for review" || normalized === "submitted for review") {
    return "Trimis la verificare";
  }
  return (
    reviewActionLabel[withoutPrefix] ||
    normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function getAvailableActions(status: string): ReviewAction[] {
  if (status === "approved") return ["suspend"];
  if (status === "suspended") return ["reinstate"];
  if (status === "pending_review" || status === "in_review") return ["approve", "reject"];
  return ["approve"];
}

export function readReviewResult(payload: unknown): ReviewResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const result = payload as Record<string, unknown>;
  const status = typeof result.status === "string" && result.status.trim() ? result.status.trim() : null;
  const providerId =
    typeof result.providerId === "string" && result.providerId.trim() ? result.providerId.trim() : null;

  return status ? { providerId, status } : null;
}

export function mergeProviderReviewResult(
  provider: ProviderDocument | null | undefined,
  result: ReviewResult,
  action?: ReviewAction,
  reason?: string
) {
  if (!provider || !result.status) {
    return provider;
  }

  const reviewedAt = new Date().toISOString();
  const nextReason = typeof reason === "string" && reason.trim() ? reason.trim() : null;
  return {
    ...provider,
    status: result.status,
    onboardingStatus: result.status,
    adminReview: action
      ? {
          ...provider.adminReview,
          action,
          reason: nextReason,
          reviewedAt,
        }
      : provider.adminReview,
    reviewState: {
      ...provider.reviewState,
      lastReviewedAt: reviewedAt,
    },
    suspension:
      result.status === "suspended"
        ? {
            ...provider.suspension,
            reason: nextReason,
            suspendedAt: reviewedAt,
          }
        : result.status === "approved"
          ? null
          : provider.suspension,
    lastPublishedAt: result.status === "approved" ? reviewedAt : provider.lastPublishedAt,
  };
}

export function mergeCaseReviewResult(
  data: ProviderCase | null,
  result: ReviewResult | null,
  action?: ReviewAction,
  reason?: string
): ProviderCase | null {
  if (!data || !result?.status) {
    return data;
  }

  const caseProviderId = getProviderId(data.provider || data.item || null);
  if (result.providerId && caseProviderId && result.providerId !== caseProviderId) {
    return data;
  }

  return {
    ...data,
    provider: mergeProviderReviewResult(data.provider, result, action, reason),
    item: mergeProviderReviewResult(data.item, result, action, reason),
  };
}

export function getInitials(value: string) {
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (!words.length) return "P";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function getLocationLabel(provider: ProviderDocument) {
  const coverageArea = provider.professionalProfile?.coverageArea || {};
  const county = readString(coverageArea.countyName) || provider.countyName;
  const city = readString(coverageArea.cityName) || provider.cityName || provider.city;
  return [county, city].filter(Boolean).join(" / ") || "Nu este completat";
}

export function getSpecialization(provider: ProviderDocument) {
  return provider.professionalProfile?.specialization || provider.serviceType || "";
}

export function getCoverageText(provider: ProviderDocument) {
  return provider.professionalProfile?.coverageAreaText || provider.coverageAreaText || "";
}

export function getActiveServices(services?: Array<Record<string, unknown>>) {
  return (services || []).filter((service) => service.status === "active");
}

export function isCompleteActiveService(service: Record<string, unknown>) {
  if (readString(service.status).toLowerCase() !== "active") {
    return false;
  }

  const hasBaseRate = (readNumber(service.baseRateAmount) ?? 0) > 0
    || String(service.baseRate || "").replace(/\D+/g, "").length > 0;

  return Boolean(
    readString(service.name)
    && readString(service.description)
    && (readString(service.categoryKey) || readString(service.categoryLabel))
    && hasBaseRate
  );
}

export function getApprovalBlockedReasons(input: {
  profileOk: boolean;
  avatarPath?: string | null;
  identityOk: boolean;
  professionalOk: boolean;
  availabilityOk: boolean;
  activeServices: Array<Record<string, unknown>>;
}) {
  return [
    !input.profileOk ? "profil profesional incomplet" : "",
    !input.avatarPath ? "poza de profil lipsește" : "",
    !input.identityOk ? "act de identitate lipsă" : "",
    !input.professionalOk ? "document profesional/firmă lipsă" : "",
    !input.availabilityOk ? "disponibilitate neconfigurată" : "",
    input.activeServices.length === 0 ? "serviciu principal/serviciu activ lipsă" : "",
    input.activeServices.length > 0 && !input.activeServices.some((service) => isCompleteActiveService(service))
      ? "serviciu activ incomplet (lipsește nume, descriere, categorie sau tarif)"
      : "",
  ].filter(Boolean);
}

export function getProviderApprovalSummary(
  technicalReasons: string[],
  status?: string | null
): ProviderApprovalSummary {
  const missingItems = technicalReasons.map(humanizeApprovalReason);
  const requirementsMet = missingItems.length === 0;
  const normalizedStatus = readString(status);

  if (normalizedStatus === "approved") {
    return {
      canApprove: true,
      headline: "Prestator aprobat",
      missingItems: requirementsMet ? [] : missingItems,
      nextAction: requirementsMet
        ? "Profilul este activ în sistem."
        : "Profilul este aprobat, dar unele elemente sunt incomplete.",
      technicalReasons,
    };
  }

  if (normalizedStatus === "rejected") {
    return {
      canApprove: false,
      headline: "Prestator respins",
      missingItems,
      nextAction: requirementsMet
        ? "Poți aproba din nou prestatorul dacă dorești."
        : "Rezolvă elementele de mai jos înainte de o nouă aprobare.",
      technicalReasons,
    };
  }

  if (normalizedStatus === "suspended") {
    return {
      canApprove: false,
      headline: "Prestator suspendat",
      missingItems,
      nextAction: "Folosește acțiunile din header pentru reactivare.",
      technicalReasons,
    };
  }

  return {
    canApprove: requirementsMet,
    headline: requirementsMet
      ? "Furnizorul poate fi aprobat"
      : "Furnizorul nu poate fi aprobat încă",
    missingItems,
    nextAction: requirementsMet
      ? "Poți apăsa Aprobă furnizor."
      : "Completează elementele de mai sus înainte de aprobare.",
    technicalReasons,
  };
}

export function getRatingSummary(providerDirectory?: Record<string, unknown> | null) {
  const ratingAverage = readNumber(providerDirectory?.ratingAverage);
  const reviewCount = readNumber(providerDirectory?.reviewCount);
  if (!ratingAverage || !reviewCount) {
    return {
      label: "Fără recenzii",
      detail: "0 recenzii",
    };
  }
  return {
    label: `${ratingAverage.toFixed(1)} / 5`,
    detail: `${reviewCount} ${reviewCount === 1 ? "recenzie" : "recenzii"}`,
  };
}

export function getPublicationMeta(providerDirectory?: Record<string, unknown> | null) {
  if (providerDirectory) {
    return {
      label: "Vizibil în aplicație",
      detail: "Profil public disponibil",
      variant: "success" as const,
    };
  }
  return {
    label: "Nepublicat",
    detail: "Profilul nu este încă public",
    variant: "outline" as const,
  };
}

export function getPublicPreviewDrift(
  provider: ProviderDocument,
  providerDirectory: Record<string, unknown> | null | undefined,
  services: Array<Record<string, unknown>> | undefined,
  availability: Record<string, unknown> | null | undefined
) {
  if (!providerDirectory) {
    return {
      hasDrift: true,
      issues: ["Profilul public nu este sincronizat."],
    };
  }

  const profile = provider.professionalProfile || {};
  const expectedDisplayName = readString(profile.businessName) || readString(profile.displayName);
  const expectedSpecialization = readString(profile.specialization || provider.serviceType);
  const expectedCoverage = readString(profile.coverageAreaText || provider.coverageAreaText);
  const expectedAvatarPath = readString(profile.avatarPath);
  const expectedAvailabilityConfigured = hasConfiguredAvailability(provider, availability || null);
  const expectedActiveServices = getActiveServices(services).length;

  const actualDisplayName = readString(providerDirectory.displayName);
  const actualSpecialization = readString(providerDirectory.categoryPrimary);
  const actualCoverage = readString(providerDirectory.coverageAreaText);
  const actualAvatarPath = readString(providerDirectory.avatarPath);
  const actualAvailabilityConfigured = providerDirectory.hasConfiguredAvailability === true;
  const actualServices = Array.isArray(providerDirectory.serviceSummaries)
    ? providerDirectory.serviceSummaries.length
    : 0;

  const issues: string[] = [];
  if (expectedDisplayName && expectedDisplayName !== actualDisplayName) {
    issues.push("Numele public diferă între profil și aplicație.");
  }
  if (expectedSpecialization && expectedSpecialization !== actualSpecialization) {
    issues.push("Categoria principală diferă între profil și aplicație.");
  }
  if (expectedCoverage && expectedCoverage !== actualCoverage) {
    issues.push("Zona de acoperire diferă între profil și aplicație.");
  }
  if (expectedAvatarPath && expectedAvatarPath !== actualAvatarPath) {
    issues.push("Poza de profil diferă între profil și aplicație.");
  }
  if (expectedAvailabilityConfigured !== actualAvailabilityConfigured) {
    issues.push("Programul nu este aliniat între profil și aplicație.");
  }
  if (expectedActiveServices !== actualServices) {
    issues.push("Numărul de servicii publice diferă de serviciile active.");
  }

  return {
    hasDrift: issues.length > 0,
    issues,
  };
}

export function getChecklistItems({
  provider,
  profileOk,
  availabilityOk,
  activeServicesCount,
  legalConsentState,
}: {
  provider: ProviderDocument;
  profileOk: boolean;
  availabilityOk: boolean;
  activeServicesCount: number;
  legalConsentState: ReturnType<typeof getProviderLegalConsentState>;
}) {
  const hasCompanyData = Boolean(
    provider.companyName ||
      provider.professionalProfile?.businessName ||
      provider.cui ||
      provider.tradeRegisterNumber ||
      provider.legalStatus
  );

  return [
    {
      title: "Profil profesional complet",
      detail: profileOk
        ? "Nume public, specializare și zonă completate."
        : "Lipsesc numele public, specializarea sau zona.",
      state: profileOk ? "complete" : "missing",
      badge: profileOk ? "Complet" : "Lipsă",
    },
    {
      title: "Disponibilitate configurată",
      detail: availabilityOk ? "Programul este configurat." : "Programul nu este configurat.",
      state: availabilityOk ? "complete" : "missing",
      badge: availabilityOk ? "Complet" : "Lipsă",
    },
    {
      title: "Servicii",
      detail:
        activeServicesCount > 0
          ? `${activeServicesCount} servicii active.`
          : "Prestatorul nu are servicii publicate încă.",
      state: activeServicesCount > 0 ? "complete" : "missing",
      badge: activeServicesCount > 0 ? "Complet" : "Lipsă",
    },
    {
      title: "Termeni acceptați",
      detail:
        legalConsentState === "accepted"
          ? "Termenii și politica sunt acceptate."
          : legalConsentState === "partial"
            ? "Consimțământul este parțial."
            : "Termenii nu sunt acceptați.",
      state: legalConsentState === "accepted" ? "complete" : "missing",
      badge: legalConsentState === "accepted" ? "Complet" : legalConsentState === "partial" ? "Parțial" : "Lipsă",
    },
    {
      title: "Date firmă completate",
      detail: hasCompanyData ? "Există date juridice sau date de firmă." : "Nu există date firmă suficiente.",
      state: hasCompanyData ? "complete" : "missing",
      badge: hasCompanyData ? "Completat" : "Lipsă",
    },
  ] satisfies ProviderChecklistItem[];
}

export function formatBooleanBadge(value: boolean | null | undefined, labels = { yes: "Da", no: "Nu", missing: "Lipsă" }) {
  if (value === true) {
    return { label: labels.yes, variant: "success" as const };
  }
  if (value === false) {
    return { label: labels.no, variant: "secondary" as const };
  }
  return { label: labels.missing, variant: "outline" as const };
}

export function hasDate(value: unknown) {
  return typeof value === "string" && value.trim() && formatAdminDateTime(value) !== "-";
}

export function formatTimelineActor(
  provider: ProviderDocument,
  actorUid?: string | null,
  actorRole?: string | null
) {
  const role = actorRole?.trim().toLowerCase();
  if (role === "admin") return "Admin";
  if (role === "support") return "Suport";
  if (role === "provider") return "Prestator";
  if (actorUid && actorUid === getProviderId(provider)) return "Prestator";
  if (actorUid && actorUid === provider.adminReview?.reviewedBy) return "Admin";
  return null;
}

export function buildTimelineEvents(
  provider: ProviderDocument,
  recentAuditEvents?: Array<Record<string, unknown>>
) {
  const events: TimelineEvent[] = [];

  if (hasDate(provider.createdAt)) {
    events.push({
      id: "created",
      title: "Cont creat",
      at: provider.createdAt,
      description: "Profilul de prestator a fost creat.",
    });
  }

  if (hasDate(provider.documents?.identity?.uploadedAt)) {
    events.push({
      id: "identity-uploaded",
      title: "Document identitate încărcat",
      at: provider.documents?.identity?.uploadedAt,
      description: provider.documents?.identity?.originalFileName || null,
    });
  }

  if (hasDate(provider.documents?.professional?.uploadedAt)) {
    events.push({
      id: "professional-uploaded",
      title: "Document profesional încărcat",
      at: provider.documents?.professional?.uploadedAt,
      description: provider.documents?.professional?.originalFileName || null,
    });
  }

  if (hasDate(provider.reviewState?.submittedAt)) {
    events.push({
      id: "submitted-review",
      title: "Trimis la verificare",
      at: provider.reviewState?.submittedAt,
      description: "Prestatorul a trimis profilul pentru verificare.",
    });
  }

  if (hasDate(provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt)) {
    events.push({
      id: "admin-review",
      title: formatReviewAction(provider.adminReview?.action),
      at: provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt,
      actor: formatTimelineActor(provider, provider.adminReview?.reviewedBy, "admin"),
      description: provider.adminReview?.reason || provider.suspension?.reason || null,
    });
  }

  (recentAuditEvents || []).forEach((event, index) => {
    const at = readString(event.createdAt) || readString(event.at);
    events.push({
      id: `audit-${String(event.id || index)}`,
      title: formatAdminActivityLabel(event.action || event.type || event.message),
      at,
      description: readString(event.message) || readString((event.context as Record<string, unknown> | undefined)?.reason) || null,
    });
  });

  return events
    .filter((event) => event.title !== "-" || event.at)
    .sort((a, b) => {
      const aTime = a.at ? Date.parse(a.at) : 0;
      const bTime = b.at ? Date.parse(b.at) : 0;
      return bTime - aTime;
    })
    .slice(0, 10);
}

export function normalizeProviderServices(services?: Array<Record<string, unknown>>) {
  return (services || []).map((service, index) => ({
    serviceId: readString(service.serviceId) || `service_${index}`,
    name: readString(service.name) || "Serviciu",
    categoryLabel: readString(service.categoryLabel) || "-",
    status: readString(service.status).toLowerCase() || "active",
    baseRateAmount: readNumber(service.baseRateAmount),
    baseRateCurrency: readString(service.baseRateCurrency) || "RON",
    estimatedDurationMinutes: readNumber(service.estimatedDurationMinutes),
    maxProfessionals: readNumber(service.maxProfessionals),
  })) satisfies ProviderServiceItem[];
}

export function getServiceStatusVariant(status: string): BadgeVariant {
  if (status === "active") return "success";
  if (status === "inactive") return "secondary";
  if (status === "archived") return "danger";
  return "outline";
}

export function formatServiceStatus(status: string) {
  return SERVICE_STATUS_LABELS[status] || status || "-";
}

export function normalizeAvailabilityDays(availability?: Record<string, unknown> | null) {
  const weekSchedule = Array.isArray((availability as { weekSchedule?: unknown[] } | null)?.weekSchedule)
    ? (availability as { weekSchedule: unknown[] }).weekSchedule
    : [];

  return weekSchedule.map((item, dayIndex) => {
    const day = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const ranges = Array.isArray(day.timeRanges) ? day.timeRanges : [];
    const normalizedRanges = ranges
      .map((range, rangeIndex) => {
        const source = range && typeof range === "object" ? range as Record<string, unknown> : {};
        return {
          id: readString(source.id) || `range_${dayIndex}_${rangeIndex}`,
          startTime: readString(source.startTime),
          endTime: readString(source.endTime),
        };
      })
      .filter((range) => Boolean(range.startTime && range.endTime));

    return {
      dayKey: readString(day.dayKey) || `day_${dayIndex}`,
      label: readString(day.label) || readString(day.dayKey) || `Ziua ${dayIndex + 1}`,
      isEnabled: day.isEnabled === true,
      timeRanges: normalizedRanges,
    };
  }) satisfies ProviderAvailabilityDay[];
}

export function formatAvailabilityDayLine(day: ProviderAvailabilityDay) {
  if (!day.isEnabled || day.timeRanges.length === 0) {
    return `${day.label}: Indisponibil`;
  }
  const intervals = day.timeRanges
    .map((range) => `${range.startTime} - ${range.endTime}`)
    .join(", ");
  return `${day.label}: ${intervals}`;
}

export function normalizeBlockedDates(availability?: Record<string, unknown> | null) {
  const blockedDates = Array.isArray((availability as { blockedDates?: unknown[] } | null)?.blockedDates)
    ? (availability as { blockedDates: unknown[] }).blockedDates
    : [];

  return blockedDates
    .map((item, index) => {
      const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        id: readString(source.id) || `blocked_${index}`,
        dateKey: readString(source.dateKey),
      };
    })
    .filter((item) => Boolean(item.dateKey)) satisfies ProviderBlockedDate[];
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  rejected: "Respinsă",
  cancelled: "Anulată",
  completed: "Finalizată",
  paid: "Plătită",
};

export function formatBookingStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return BOOKING_STATUS_LABELS[normalized] || formatCompactValue(status);
}

export function tabTriggerClass(active: boolean): string {
  const base =
    "rounded-md px-4 py-2 text-sm font-medium transition border border-transparent";
  return active
    ? `${base} bg-primary text-primary-foreground`
    : `${base} bg-muted text-muted-foreground hover:bg-muted/70`;
}

export {
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  providerLegalStatusLabel,
};

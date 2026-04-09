import {
  PROVIDER_LEGAL_STATUSES,
  PROVIDER_STATUSES,
  type ProviderLegalStatus,
  type ProviderRecord,
  type ProviderStatus,
} from "@/types/provider";

export const providerStatusLabel: Record<ProviderStatus, string> = {
  new: "Nou",
  in_review: "In verificare",
  approved: "Aprobat",
  rejected: "Respins",
};

export function providerStatusVariant(status?: string | null) {
  if (status === "approved") {
    return "success" as const;
  }
  if (status === "rejected") {
    return "danger" as const;
  }
  if (status === "in_review") {
    return "warning" as const;
  }
  return "outline" as const;
}

export const providerLegalStatusLabel: Record<ProviderLegalStatus, string> = {
  pfa_ready: "Am PFA",
  srl_ready: "Am SRL",
  in_progress: "Sunt in curs de infiintare",
  need_guidance: "Am nevoie de ghidaj",
};

export const PROVIDER_TERMS_VERSION = "v1";
export const PROVIDER_PRIVACY_VERSION = "v1";
export const PROVIDER_LAUNCH_CONTACT_CONSENT_VERSION = "v1";

type ProviderConsentSnapshot = Pick<
  ProviderRecord,
  | "termsAcceptedAt"
  | "termsVersion"
  | "privacyAcceptedAt"
  | "privacyVersion"
  | "launchContactConsent"
  | "launchContactConsentAt"
  | "launchContactConsentVersion"
>;

export type ProviderLegalConsentState = "accepted" | "partial" | "missing";

export function getProviderLegalConsentState(
  provider: ProviderConsentSnapshot
): ProviderLegalConsentState {
  const hasTermsConsent = Boolean(provider.termsAcceptedAt || provider.termsVersion);
  const hasPrivacyConsent = Boolean(provider.privacyAcceptedAt || provider.privacyVersion);

  if (hasTermsConsent && hasPrivacyConsent) {
    return "accepted";
  }
  if (hasTermsConsent || hasPrivacyConsent) {
    return "partial";
  }
  return "missing";
}

export type ProviderLaunchContactConsentState = "accepted" | "declined" | "missing";

export function getProviderLaunchContactConsentState(
  provider: ProviderConsentSnapshot
): ProviderLaunchContactConsentState {
  if (
    provider.launchContactConsent === true ||
    Boolean(provider.launchContactConsentAt) ||
    Boolean(provider.launchContactConsentVersion)
  ) {
    return "accepted";
  }
  if (provider.launchContactConsent === false) {
    return "declined";
  }
  return "missing";
}

/** Canonical values stored in Firestore / validated by API; labels come from i18n. */
export const PROVIDER_CITY_ENTRIES = [
  { value: "Bucuresti", messageKey: "cityBucuresti" },
  { value: "Cluj-Napoca", messageKey: "cityCluj" },
  { value: "Timisoara", messageKey: "cityTimisoara" },
  { value: "Iasi", messageKey: "cityIasi" },
  { value: "Constanta", messageKey: "cityConstanta" },
  { value: "Brasov", messageKey: "cityBrasov" },
] as const;

export const PROVIDER_SERVICE_ENTRIES = [
  { value: "Curatenie rezidentiala", messageKey: "serviceResidential" },
  { value: "Curatenie birouri", messageKey: "serviceOffices" },
  { value: "Curatenie dupa renovare", messageKey: "servicePostRenovation" },
  { value: "Curatenie canapele", messageKey: "serviceUpholstery" },
  { value: "Curatenie geamuri", messageKey: "serviceWindows" },
  { value: "Curatenie industriala", messageKey: "serviceIndustrial" },
] as const;

export const providerCityOptions = PROVIDER_CITY_ENTRIES.map((e) => e.value);

export const providerServiceOptions = PROVIDER_SERVICE_ENTRIES.map((e) => e.value);

function normalizeOption(value: string) {
  return value.trim().toLowerCase();
}

export function isProviderStatus(value: string): value is ProviderStatus {
  return (PROVIDER_STATUSES as readonly string[]).includes(value);
}

export function isProviderLegalStatus(value: string): value is ProviderLegalStatus {
  return (PROVIDER_LEGAL_STATUSES as readonly string[]).includes(value);
}

export function isProviderCityOption(value: string) {
  return providerCityOptions.some((option) => normalizeOption(option) === normalizeOption(value));
}

export function isProviderServiceOption(value: string) {
  return providerServiceOptions.some(
    (option) => normalizeOption(option) === normalizeOption(value)
  );
}

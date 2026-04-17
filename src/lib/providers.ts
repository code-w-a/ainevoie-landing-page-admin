import {
  PROVIDER_LEGAL_STATUSES,
  PROVIDER_STATUSES,
  type ProviderLegalStatus,
  type ProviderRecord,
  type ProviderStatus,
} from "@/types/provider";
import {
  ROMANIA_URBAN_LOCALITIES,
  normalizeRomaniaLocationName,
} from "@/lib/romaniaLocations";

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

export const PROVIDER_SERVICE_ENTRIES = [
  { value: "Curatenie rezidentiala", messageKey: "serviceResidential" },
  { value: "Curatenie birouri", messageKey: "serviceOffices" },
  { value: "Curatenie dupa renovare", messageKey: "servicePostRenovation" },
  { value: "Curatenie canapele", messageKey: "serviceUpholstery" },
  { value: "Curatenie geamuri", messageKey: "serviceWindows" },
  { value: "Curatenie industriala", messageKey: "serviceIndustrial" },
] as const;

/** Legacy compatibility: old admin filters and documents used city names only. */
export const providerCityOptions = Array.from(
  new Set(ROMANIA_URBAN_LOCALITIES.map((city) => city.cityName))
).sort((a, b) => a.localeCompare(b, "ro"));

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
  return providerCityOptions.some(
    (option) => normalizeRomaniaLocationName(option) === normalizeRomaniaLocationName(value)
  );
}

export function isProviderServiceOption(value: string) {
  return providerServiceOptions.some(
    (option) => normalizeOption(option) === normalizeOption(value)
  );
}

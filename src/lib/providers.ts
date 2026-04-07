import {
  PROVIDER_LEGAL_STATUSES,
  PROVIDER_STATUSES,
  type ProviderLegalStatus,
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

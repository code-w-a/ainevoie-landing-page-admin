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

export const providerCityOptions = [
  "Bucuresti",
  "Cluj-Napoca",
  "Timisoara",
  "Iasi",
  "Constanta",
  "Brasov",
];

export const providerServiceOptions = [
  "Curatenie rezidentiala",
  "Curatenie birouri",
  "Curatenie dupa renovare",
  "Curatenie canapele",
  "Curatenie geamuri",
  "Curatenie industriala",
];

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

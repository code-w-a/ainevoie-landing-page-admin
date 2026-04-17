export const PROVIDER_STATUSES = ["new", "in_review", "approved", "rejected"] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const PROVIDER_LEGAL_STATUSES = [
  "pfa_ready",
  "srl_ready",
  "in_progress",
  "need_guidance",
] as const;
export type ProviderLegalStatus = (typeof PROVIDER_LEGAL_STATUSES)[number];

export const PROVIDER_NEWSLETTER_SIGNUP_STATUSES = [
  "already_active",
  "subscribed",
  "skipped",
  "error",
] as const;
export type ProviderNewsletterStatusAtSignup =
  (typeof PROVIDER_NEWSLETTER_SIGNUP_STATUSES)[number];

export type ProviderRecord = {
  id?: string;
  uid: string;
  email: string;
  emailNormalized: string;
  fullName: string;
  phone: string;
  countyCode?: string;
  countyName?: string;
  countyNameNormalized?: string;
  cityCode?: string;
  cityName?: string;
  cityNameNormalized?: string;
  coverageAreaText?: string;
  city: string;
  cityNormalized?: string;
  serviceType: string;
  legalStatus: ProviderLegalStatus;
  companyName?: string | null;
  companyNameNormalized?: string | null;
  cui?: string | null;
  tradeRegisterNumber?: string | null;
  estimatedSetupTimeline?: string | null;
  hasAccountant?: "yes" | "no" | "unsure" | null;
  newsletterOptIn?: boolean;
  newsletterStatusAtSignup?: ProviderNewsletterStatusAtSignup | null;
  newsletterError?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyVersion?: string | null;
  launchContactConsent?: boolean;
  launchContactConsentAt?: string | null;
  launchContactConsentVersion?: string | null;
  onboardingStatus: ProviderStatus;
  source: "landing_onboarding";
  internalNotes?: string;
  welcomeEmailSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

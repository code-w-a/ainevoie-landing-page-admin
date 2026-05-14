type ScreenshotLocale = "ro" | "en";

export const SCREENSHOT_SOURCES = {
  ro: {
    splash: "/images/screenshots/splash.jpg",
    onboarding1: "/images/screenshots/Onboarding_unu.jpg",
    onboarding2: "/images/screenshots/Onboarding_doi.jpg",
    onboarding3: "/images/screenshots/Onboarding_trei.jpg",
    home: "/images/screenshots/utilizator_ecran_home.png",
    providerProfile: "/images/screenshots/utilizator_ecran_prestator.jpg",
    bookingConfirmation:
      "/images/screenshots/utilizator_ecran_confirmare_rezervare.jpg",
    chat: "/images/screenshots/utilizator_ecran_chat.jpg",
    providerRequests: "/images/screenshots/Prestator_cereri.jpg",
    providerCalendar: "/images/screenshots/Prestator_calendar.jpg",
    providerReviews: "/images/screenshots/Prestator_ecran_recenzii.jpg",
  },
  en: {
    splash: "/images/screenshots/EN/splash.jpg",
    onboarding1: "/images/screenshots/EN/onboarding_unu.png",
    onboarding2: "/images/screenshots/EN/onboarding_doi.png",
    onboarding3: "/images/screenshots/EN/onboarding_trei.png",
    home: "/images/screenshots/EN/utilizator_ecran_home.png",
    providerProfile: "/images/screenshots/EN/utilizator_ecran_prestator.png",
    bookingConfirmation:
      "/images/screenshots/EN/utilizator_ecran_confirmare_rezervare.png",
    chat: "/images/screenshots/EN/utilizator_ecran_chat.png",
    providerRequests: "/images/screenshots/EN/prestator_cereri.png",
    providerCalendar: "/images/screenshots/EN/prestator_calendar.png",
    providerReviews: "/images/screenshots/EN/Prestator_ecran_recenzii.png",
  },
} as const;

export type ScreenshotKey = keyof typeof SCREENSHOT_SOURCES.ro;

function resolveScreenshotLocale(locale: string | undefined): ScreenshotLocale {
  return locale === "en" ? "en" : "ro";
}

export function getLocalizedScreenshot(key: ScreenshotKey, locale?: string) {
  return SCREENSHOT_SOURCES[resolveScreenshotLocale(locale)][key];
}

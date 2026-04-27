import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { type AppLocale, getRequestLocale } from "@/lib/apiLocale";
import { getApiErrorMessage } from "@/lib/apiMessages";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendEmail } from "@/lib/email";
import { captureServerException } from "@/lib/sentryServer";
import {
  PROVIDER_LAUNCH_CONTACT_CONSENT_VERSION,
  PROVIDER_PRIVACY_VERSION,
  PROVIDER_TERMS_VERSION,
  isProviderLegalStatus,
  isProviderServiceOption,
} from "@/lib/providers";
import {
  findRomaniaCity,
  findRomaniaCounty,
  isRomaniaCountyCode,
  normalizeRomaniaLocationCode,
  normalizeRomaniaLocationName,
} from "@/lib/romaniaLocations";
import { renderTemplate } from "@/lib/emailTemplates/adminEmailTemplates";
import { getEmailTemplateConfig } from "@/lib/emailTemplates/adminEmailTemplatesServer";
import type {
  ProviderLegalStatus,
  ProviderNewsletterStatusAtSignup,
} from "@/types/provider";

type OnboardingPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  countyCode?: string;
  cityCode?: string;
  city?: string;
  serviceType?: string;
  legalStatus?: ProviderLegalStatus;
  companyName?: string;
  cui?: string;
  tradeRegisterNumber?: string;
  estimatedSetupTimeline?: string;
  hasAccountant?: "yes" | "no" | "unsure";
  newsletterOptIn?: boolean;
  launchContactConsent?: boolean;
  acceptTerms?: boolean;
  locale?: string;
};

const MIN_PASSWORD_LENGTH = 8;

function normalize(value?: string) {
  return (value || "").trim();
}

function normalizeEmail(value?: string) {
  return normalize(value).toLowerCase();
}

type WelcomeEmailResult = {
  sent: boolean;
  errorMessage?: string;
};

async function sendWelcomeEmail(
  email: string,
  fullName: string,
  locale: AppLocale
): Promise<WelcomeEmailResult> {
  try {
    const config = await getEmailTemplateConfig();
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale,
      config,
      vars: { fullName, email },
    });
    await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    return { sent: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "welcome_email_failed";
    return { sent: false, errorMessage };
  }
}

function jsonError(locale: AppLocale, code: string, status: number) {
  return NextResponse.json(
    { error: getApiErrorMessage(locale, code), code },
    { status }
  );
}

function resolveLocale(body: OnboardingPayload, request: Request): AppLocale {
  if (body.locale === "en" || body.locale === "ro") {
    return body.locale;
  }
  return getRequestLocale(request);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OnboardingPayload;
    const locale = resolveLocale(body, request);
    const fullName = normalize(body.fullName);
    const email = normalizeEmail(body.email);
    const password = normalize(body.password);
    const phone = normalize(body.phone);
    const countyCode = normalizeRomaniaLocationCode(body.countyCode);
    const cityCode = normalizeRomaniaLocationCode(body.cityCode);
    const serviceType = normalize(body.serviceType);
    const legalStatus = body.legalStatus;
    const companyName = normalize(body.companyName);
    const cui = normalize(body.cui);
    const tradeRegisterNumber = normalize(body.tradeRegisterNumber);
    const estimatedSetupTimeline = normalize(body.estimatedSetupTimeline);
    const hasAccountant = body.hasAccountant || null;
    const newsletterOptIn = body.newsletterOptIn === true;
    const launchContactConsent = body.launchContactConsent === true;
    const acceptTerms = body.acceptTerms === true;

    if (
      !fullName ||
      !email ||
      !password ||
      !phone ||
      !countyCode ||
      !cityCode ||
      !serviceType ||
      !legalStatus
    ) {
      return jsonError(locale, "MISSING_FIELDS", 400);
    }

    if (!email.includes("@")) {
      return jsonError(locale, "INVALID_EMAIL", 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return jsonError(locale, "PASSWORD_TOO_SHORT", 400);
    }

    if (!isProviderLegalStatus(legalStatus)) {
      return jsonError(locale, "INVALID_LEGAL_STATUS", 400);
    }
    if (
      (legalStatus === "pfa_ready" || legalStatus === "srl_ready") &&
      (!companyName || !cui)
    ) {
      return jsonError(locale, "COMPANY_DETAILS_REQUIRED", 400);
    }
    if (legalStatus === "in_progress" && !estimatedSetupTimeline) {
      return jsonError(locale, "SETUP_TIMELINE_REQUIRED", 400);
    }
    if (!isRomaniaCountyCode(countyCode)) {
      return jsonError(locale, "INVALID_COUNTY", 400);
    }

    const selectedCounty = findRomaniaCounty(countyCode);
    const selectedCity = findRomaniaCity(countyCode, cityCode);

    if (!selectedCounty || !selectedCity) {
      return jsonError(locale, "INVALID_CITY", 400);
    }
    if (!isProviderServiceOption(serviceType)) {
      return jsonError(locale, "INVALID_SERVICE", 400);
    }

    if (!acceptTerms) {
      return jsonError(locale, "TERMS_NOT_ACCEPTED", 400);
    }

    const countyName = selectedCounty.name;
    const cityName = selectedCity.cityName;
    const countyNameNormalized = normalizeRomaniaLocationName(countyName);
    const cityNameNormalized = normalizeRomaniaLocationName(cityName);
    const coverageAreaText = `România, ${countyName}, ${cityName}`;
    const providerDisplayName = companyName || fullName;
    const notificationPreferences = {
      bookings: true,
      messages: true,
      promoSystem: true,
    };

    const db = getAdminDb();

    const existingProvider = await db
      .collection("providers")
      .where("emailNormalized", "==", email)
      .limit(1)
      .get();

    if (!existingProvider.empty) {
      return jsonError(locale, "PROVIDER_EMAIL_EXISTS", 409);
    }

    let userRecord;
    try {
      userRecord = await getAuth().createUser({
        email,
        password,
        displayName: fullName,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "create_user_failed";
      if (message.includes("email-already-exists")) {
        return jsonError(locale, "AUTH_EMAIL_EXISTS", 409);
      }
      throw error;
    }

    const welcomeEmailResult = await sendWelcomeEmail(email, fullName, locale);

    let newsletterStatusAtSignup: ProviderNewsletterStatusAtSignup = "skipped";
    let newsletterError: string | null = null;

    if (newsletterOptIn) {
      try {
        let existingSubscriber = await db
          .collection("newsletter_subscribers")
          .where("emailNormalized", "==", email)
          .limit(1)
          .get();

        if (existingSubscriber.empty) {
          existingSubscriber = await db
            .collection("newsletter_subscribers")
            .where("email", "==", email)
            .limit(1)
            .get();
        }

        if (!existingSubscriber.empty) {
          const docRef = existingSubscriber.docs[0].ref;
          const status = existingSubscriber.docs[0].get("status");

          if (status === "active") {
            newsletterStatusAtSignup = "already_active";
          } else {
            await docRef.update({
              email,
              emailNormalized: email,
              status: "active",
              source: "provider_onboarding",
              consentGranted: true,
              consentCapturedAt: FieldValue.serverTimestamp(),
              consentSource: "provider_onboarding",
              consentTextVersion: "v1",
              consentMethod: "single_opt_in",
              consentWithdrawnAt: null,
              updatedAt: FieldValue.serverTimestamp(),
            });
            newsletterStatusAtSignup = "subscribed";
          }
        } else {
          await db.collection("newsletter_subscribers").add({
            email,
            emailNormalized: email,
            status: "active",
            tags: [],
            source: "provider_onboarding",
            consentGranted: true,
            consentCapturedAt: FieldValue.serverTimestamp(),
            consentSource: "provider_onboarding",
            consentTextVersion: "v1",
            consentMethod: "single_opt_in",
            consentWithdrawnAt: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          newsletterStatusAtSignup = "subscribed";
        }
      } catch (error) {
        newsletterStatusAtSignup = "error";
        newsletterError =
          error instanceof Error ? error.message : "newsletter_subscribe_failed";
      }
    }

    await db.collection("providers").doc(userRecord.uid).set({
      // Canonical provider document model aligned with docs/AInevoie-Firebase-Document-Model-Schema.md
      uid: userRecord.uid,
      role: "provider",
      status: "pre_registered",
      accountStatus: "active",
      email,
      phoneNumber: phone,
      authProviders: ["password"],
      locale,
      notificationPreferences,
      professionalProfile: {
        businessName: companyName || null,
        displayName: providerDisplayName,
        specialization: serviceType,
        baseRateAmount: 0,
        baseRateCurrency: "RON",
        coverageArea: {
          countryCode: "RO",
          countryName: "România",
          countyCode: selectedCounty.code,
          countyName,
          cityCode: selectedCity.cityCode,
          cityName,
          placeId: null,
          locationLabel: null,
          formattedAddress: null,
          centerLat: null,
          centerLng: null,
        },
        coverageAreaText,
        shortBio: null,
        availabilitySummary: null,
        avatarPath: null,
      },
      documents: {
        identity: {
          status: "missing",
          storagePath: null,
          originalFileName: null,
          uploadedAt: null,
        },
        professional: {
          status: "missing",
          storagePath: null,
          originalFileName: null,
          uploadedAt: null,
        },
      },
      reviewState: {
        submittedAt: null,
        lastReviewedAt: null,
      },
      schemaVersion: 1,
      createdBy: userRecord.uid,
      updatedBy: userRecord.uid,

      // Legacy fields kept temporarily for landing/admin compatibility.
      emailNormalized: email,
      fullName,
      phone,
      countyCode: selectedCounty.code,
      countyName,
      countyNameNormalized,
      cityCode: selectedCity.cityCode,
      cityName,
      cityNameNormalized,
      coverageAreaText,
      city: cityName,
      cityNormalized: cityNameNormalized,
      serviceType,
      serviceTypeNormalized: serviceType.toLowerCase(),
      legalStatus,
      companyName: companyName || null,
      companyNameNormalized: companyName ? companyName.toLowerCase() : null,
      cui: cui || null,
      tradeRegisterNumber: tradeRegisterNumber || null,
      estimatedSetupTimeline: estimatedSetupTimeline || null,
      hasAccountant,
      newsletterOptIn,
      newsletterStatusAtSignup,
      newsletterError,
      termsAcceptedAt: FieldValue.serverTimestamp(),
      termsVersion: PROVIDER_TERMS_VERSION,
      privacyAcceptedAt: FieldValue.serverTimestamp(),
      privacyVersion: PROVIDER_PRIVACY_VERSION,
      launchContactConsent,
      launchContactConsentAt: launchContactConsent ? FieldValue.serverTimestamp() : null,
      launchContactConsentVersion: launchContactConsent ?
        PROVIDER_LAUNCH_CONTACT_CONSENT_VERSION
      : null,
      onboardingStatus: "pre_registered",
      source: "landing_onboarding",
      welcomeEmailSent: welcomeEmailResult.sent,
      welcomeEmailError: welcomeEmailResult.errorMessage || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection("providers").doc(userRecord.uid).collection("events").add({
      type: "status_changed",
      fromStatus: null,
      toStatus: "pre_registered",
      actorUid: "system_onboarding",
      note: "Prestator inregistrat prin onboarding public.",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      status: "created",
      uid: userRecord.uid,
      welcomeEmailSent: welcomeEmailResult.sent,
      newsletterStatusAtSignup,
    });
  } catch (error) {
    captureServerException(error, { route: "api/providers/onboarding/route.ts" });
    const locale = getRequestLocale(request);
    return jsonError(locale, "SERVER_ERROR", 500);
  }
}

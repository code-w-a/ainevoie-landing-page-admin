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
  isProviderCityOption,
  isProviderLegalStatus,
  isProviderServiceOption,
} from "@/lib/providers";
import {
  getProviderWelcomeEmailSubject,
  getProviderWelcomeTemplate,
} from "@/lib/emailTemplates/providerWelcome";
import type {
  ProviderLegalStatus,
  ProviderNewsletterStatusAtSignup,
} from "@/types/provider";

type OnboardingPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
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
    const template = getProviderWelcomeTemplate({ fullName, locale });
    await sendEmail({
      to: email,
      subject: getProviderWelcomeEmailSubject(locale),
      html: template.html,
      text: template.text,
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
    const city = normalize(body.city);
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

    if (!fullName || !email || !password || !phone || !city || !serviceType || !legalStatus) {
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
    if (!isProviderCityOption(city)) {
      return jsonError(locale, "INVALID_CITY", 400);
    }
    if (!isProviderServiceOption(serviceType)) {
      return jsonError(locale, "INVALID_SERVICE", 400);
    }

    if (!acceptTerms) {
      return jsonError(locale, "TERMS_NOT_ACCEPTED", 400);
    }

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
      uid: userRecord.uid,
      email,
      emailNormalized: email,
      fullName,
      phone,
      city,
      cityNormalized: city.toLowerCase(),
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
      onboardingStatus: "new",
      source: "landing_onboarding",
      welcomeEmailSent: welcomeEmailResult.sent,
      welcomeEmailError: welcomeEmailResult.errorMessage || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection("providers").doc(userRecord.uid).collection("events").add({
      type: "status_changed",
      fromStatus: null,
      toStatus: "new",
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

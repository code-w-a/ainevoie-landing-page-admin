import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendEmail } from "@/lib/email";
import {
  isProviderCityOption,
  isProviderLegalStatus,
  isProviderServiceOption,
} from "@/lib/providers";
import { getProviderWelcomeTemplate } from "@/lib/emailTemplates/providerWelcome";
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
  acceptTerms?: boolean;
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
  fullName: string
): Promise<WelcomeEmailResult> {
  try {
    const template = getProviderWelcomeTemplate({ fullName });
    await sendEmail({
      to: email,
      subject: "Bine ai venit pe AInevoie",
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OnboardingPayload;
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
    const acceptTerms = body.acceptTerms === true;

    if (!fullName || !email || !password || !phone || !city || !serviceType || !legalStatus) {
      return NextResponse.json(
        { error: "Toate campurile sunt obligatorii." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email invalid." }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Parola trebuie sa aiba cel putin 8 caractere." },
        { status: 400 }
      );
    }

    if (!isProviderLegalStatus(legalStatus)) {
      return NextResponse.json(
        { error: "Status juridic invalid." },
        { status: 400 }
      );
    }
    if (
      (legalStatus === "pfa_ready" || legalStatus === "srl_ready") &&
      (!companyName || !cui)
    ) {
      return NextResponse.json(
        { error: "Pentru PFA/SRL, numele companiei și CUI sunt obligatorii." },
        { status: 400 }
      );
    }
    if (legalStatus === "in_progress" && !estimatedSetupTimeline) {
      return NextResponse.json(
        { error: "Te rugăm să selectezi un interval estimativ de înființare." },
        { status: 400 }
      );
    }
    if (!isProviderCityOption(city)) {
      return NextResponse.json(
        { error: "Orasul selectat nu este valid." },
        { status: 400 }
      );
    }
    if (!isProviderServiceOption(serviceType)) {
      return NextResponse.json(
        { error: "Tipul de serviciu selectat nu este valid." },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "Trebuie sa accepti termenii si politica de confidentialitate." },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    const existingProvider = await db
      .collection("providers")
      .where("emailNormalized", "==", email)
      .limit(1)
      .get();

    if (!existingProvider.empty) {
      return NextResponse.json(
        { error: "Exista deja un cont pentru acest email." },
        { status: 409 }
      );
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
        return NextResponse.json(
          { error: "Emailul este deja folosit." },
          { status: 409 }
        );
      }
      throw error;
    }

    const welcomeEmailResult = await sendWelcomeEmail(email, fullName);

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
    return NextResponse.json(
      { error: "Nu am putut finaliza inregistrarea. Incearca din nou." },
      { status: 500 }
    );
  }
}

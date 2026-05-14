import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { getRequestLocale, type AppLocale } from "@/lib/apiLocale";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/emailTemplates/adminEmailTemplates";
import { getEmailTemplateConfig } from "@/lib/emailTemplates/adminEmailTemplatesServer";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
const ROUTE_TAG = "[provider-onboarding-welcome-email]";

function readBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveProviderLocale(value: unknown): AppLocale {
  return value === "en" ? "en" : "ro";
}

function isValidEmail(value: string) {
  return value.includes("@");
}

function readErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }

  return "UNKNOWN";
}

function readErrorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).trim().slice(0, 500);
}

function getLocalizedErrorMessage(locale: AppLocale, key: "unauthorized" | "providerMissing" | "providerEmailMissing" | "serverError") {
  if (locale === "en") {
    if (key === "unauthorized") return "Unauthorized.";
    if (key === "providerMissing") return "Provider profile was not found.";
    if (key === "providerEmailMissing") return "Provider email is missing or invalid.";
    return "Could not send the onboarding email.";
  }

  if (key === "unauthorized") return "Neautorizat.";
  if (key === "providerMissing") return "Profilul prestatorului nu a fost găsit.";
  if (key === "providerEmailMissing") return "Emailul prestatorului lipsește sau este invalid.";
  return "Nu am putut trimite emailul de onboarding.";
}

function appendVerificationLinkContent(
  locale: AppLocale,
  html: string,
  text: string,
  emailVerificationLink?: string | null,
) {
  if (!emailVerificationLink || !emailVerificationLink.startsWith("http")) {
    return { html, text };
  }

  const href = emailVerificationLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  if (locale === "en") {
    return {
      html:
        html +
        `<p style="margin-top:18px;line-height:1.5;"><strong>Confirm your email address</strong></p>` +
        `<p>Please verify that this inbox belongs to you: <a href="${href}" style="color:#d35400;font-weight:600;">Verify email address</a></p>`,
      text: `${text}\n\nConfirm your email address: ${emailVerificationLink}\n`,
    };
  }

  return {
    html:
      html +
      `<p style="margin-top:18px;line-height:1.5;"><strong>Confirmă adresa de email</strong></p>` +
      `<p>Te rugăm să confirmi că acest inbox îți aparține: <a href="${href}" style="color:#d35400;font-weight:600;">Verifică adresa de email</a></p>`,
    text: `${text}\n\nConfirmă adresa de email: ${emailVerificationLink}\n`,
  };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const requestLocale = getRequestLocale(request);
  const token = readBearerToken(request);

  console.info(`${ROUTE_TAG} request_start`, {
    requestId,
    locale: requestLocale,
    hasBearerToken: Boolean(token),
  });

  if (!token) {
    console.warn(`${ROUTE_TAG} auth_missing_token`, {
      requestId,
    });
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "unauthorized"), code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let decodedToken: { uid: string };
  try {
    decodedToken = await getAdminAuth().verifyIdToken(token) as { uid: string };
    console.info(`${ROUTE_TAG} auth_verified`, {
      requestId,
      uid: decodedToken.uid,
    });
  } catch (error) {
    console.warn(`${ROUTE_TAG} auth_invalid_token`, {
      requestId,
      errorCode: readErrorCode(error),
      errorMessage: readErrorMessage(error),
    });
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "unauthorized"), code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const providerRef = getAdminDb().collection("providers").doc(decodedToken.uid);
  const providerSnap = await providerRef.get();

  if (!providerSnap.exists) {
    console.warn(`${ROUTE_TAG} provider_missing`, {
      requestId,
      uid: decodedToken.uid,
    });
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "providerMissing"), code: "PROVIDER_NOT_FOUND" },
      { status: 404 },
    );
  }

  const providerData = providerSnap.data() || {};
  const providerEmail = sanitizeText(providerData.email).toLowerCase();
  console.info(`${ROUTE_TAG} provider_loaded`, {
    requestId,
    uid: decodedToken.uid,
    hasEmail: Boolean(providerEmail),
    welcomeEmailSent: providerData.welcomeEmailSent === true,
  });

  if (!providerEmail || !isValidEmail(providerEmail)) {
    console.warn(`${ROUTE_TAG} provider_email_invalid`, {
      requestId,
      uid: decodedToken.uid,
    });
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "providerEmailMissing"), code: "PROVIDER_EMAIL_INVALID" },
      { status: 400 },
    );
  }

  if (providerData.welcomeEmailSent === true) {
    console.info(`${ROUTE_TAG} already_sent`, {
      requestId,
      uid: decodedToken.uid,
    });
    return NextResponse.json({ sent: true, alreadySent: true }, { status: 200 });
  }

  const providerLocale = resolveProviderLocale(providerData.locale);
  const providerName =
    sanitizeText(providerData.professionalProfile?.displayName)
    || sanitizeText(providerData.fullName)
    || (providerLocale === "en" ? "Provider" : "Prestator");

  let emailVerificationLink: string | null = null;
  try {
    emailVerificationLink = await getAdminAuth().generateEmailVerificationLink(providerEmail);
    console.info(`${ROUTE_TAG} verification_link_generated`, {
      requestId,
      uid: decodedToken.uid,
      hasLink: Boolean(emailVerificationLink),
    });
  } catch (error) {
    console.warn(`${ROUTE_TAG} verification_link_failed`, {
      requestId,
      uid: decodedToken.uid,
      errorCode: readErrorCode(error),
      errorMessage: readErrorMessage(error),
    });
  }

  try {
    const config = await getEmailTemplateConfig();
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale: providerLocale,
      config,
      vars: { fullName: providerName, email: providerEmail },
    });
    const body = appendVerificationLinkContent(
      providerLocale,
      rendered.html,
      rendered.text,
      emailVerificationLink,
    );

    console.info(`${ROUTE_TAG} send_attempt`, {
      requestId,
      uid: decodedToken.uid,
      locale: providerLocale,
      templateKind: "providerWelcome",
    });

    await sendEmail({
      to: providerEmail,
      subject: rendered.subject,
      html: body.html,
      text: body.text,
    }, {
      channel: "provider_onboarding_welcome",
      templateKind: "providerWelcome",
      requestId,
      route: "api/providers/onboarding/welcome-email",
      providerId: decodedToken.uid,
    });

    console.info(`${ROUTE_TAG} firestore_status_update_attempt`, {
      requestId,
      uid: decodedToken.uid,
      outcome: "success",
    });

    await providerRef.set({
      welcomeEmailSent: true,
      welcomeEmailError: null,
      welcomeEmailSentAt: FieldValue.serverTimestamp(),
      welcomeEmailLastAttemptAt: FieldValue.serverTimestamp(),
      welcomeEmailLastOutcome: "success",
      welcomeEmailLastErrorCode: null,
      welcomeEmailLastErrorMessage: null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid,
    }, { merge: true });

    console.info(`${ROUTE_TAG} request_success`, {
      requestId,
      uid: decodedToken.uid,
    });
    return NextResponse.json({ sent: true, alreadySent: false }, { status: 200 });
  } catch (error) {
    const errorCode = readErrorCode(error);
    const errorMessage = readErrorMessage(error) || "welcome_email_failed";

    console.error(`${ROUTE_TAG} request_failed`, {
      requestId,
      uid: decodedToken.uid,
      errorCode,
      errorMessage,
    });

    try {
      console.info(`${ROUTE_TAG} firestore_status_update_attempt`, {
        requestId,
        uid: decodedToken.uid,
        outcome: "failed",
      });

      await providerRef.set({
        welcomeEmailSent: false,
        welcomeEmailError: errorMessage,
        welcomeEmailLastAttemptAt: FieldValue.serverTimestamp(),
        welcomeEmailLastOutcome: "failed",
        welcomeEmailLastErrorCode: errorCode,
        welcomeEmailLastErrorMessage: errorMessage,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: decodedToken.uid,
      }, { merge: true });
    } catch (statusPersistError) {
      console.error(`${ROUTE_TAG} firestore_status_update_failed`, {
        requestId,
        uid: decodedToken.uid,
        errorCode: readErrorCode(statusPersistError),
        errorMessage: readErrorMessage(statusPersistError),
      });
    }

    captureServerException(error, {
      route: "api/providers/onboarding/welcome-email/route.ts",
      extra: {
        requestId,
        uid: decodedToken.uid,
        errorCode,
      },
    });

    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "serverError"), code: "WELCOME_EMAIL_FAILED" },
      { status: 500 },
    );
  }
}

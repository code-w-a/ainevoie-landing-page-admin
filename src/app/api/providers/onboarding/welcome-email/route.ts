import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getRequestLocale, type AppLocale } from "@/lib/apiLocale";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/emailTemplates/adminEmailTemplates";
import { getEmailTemplateConfig } from "@/lib/emailTemplates/adminEmailTemplatesServer";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

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
  const requestLocale = getRequestLocale(request);
  const token = readBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "unauthorized"), code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let decodedToken: { uid: string };
  try {
    decodedToken = await getAdminAuth().verifyIdToken(token) as { uid: string };
  } catch {
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "unauthorized"), code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const providerRef = getAdminDb().collection("providers").doc(decodedToken.uid);
  const providerSnap = await providerRef.get();

  if (!providerSnap.exists) {
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "providerMissing"), code: "PROVIDER_NOT_FOUND" },
      { status: 404 },
    );
  }

  const providerData = providerSnap.data() || {};
  const providerEmail = sanitizeText(providerData.email).toLowerCase();
  if (!providerEmail || !isValidEmail(providerEmail)) {
    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "providerEmailMissing"), code: "PROVIDER_EMAIL_INVALID" },
      { status: 400 },
    );
  }

  if (providerData.welcomeEmailSent === true) {
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
  } catch (error) {
    console.warn("[provider-onboarding-welcome-email] verification link generation failed", {
      uid: decodedToken.uid,
      message: error instanceof Error ? error.message : String(error),
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

    await sendEmail({
      to: providerEmail,
      subject: rendered.subject,
      html: body.html,
      text: body.text,
    });

    await providerRef.set({
      welcomeEmailSent: true,
      welcomeEmailError: null,
      welcomeEmailSentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid,
    }, { merge: true });

    return NextResponse.json({ sent: true, alreadySent: false }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "welcome_email_failed";

    await providerRef.set({
      welcomeEmailSent: false,
      welcomeEmailError: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid,
    }, { merge: true });

    captureServerException(error, {
      route: "api/providers/onboarding/welcome-email/route.ts",
      extra: {
        uid: decodedToken.uid,
      },
    });

    return NextResponse.json(
      { error: getLocalizedErrorMessage(requestLocale, "serverError"), code: "WELCOME_EMAIL_FAILED" },
      { status: 500 },
    );
  }
}

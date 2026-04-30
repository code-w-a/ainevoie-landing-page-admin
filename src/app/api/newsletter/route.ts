import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getRequestLocale } from "@/lib/apiLocale";
import { jsonApiError } from "@/lib/apiJsonError";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

export async function POST(req: Request) {
  const locale = getRequestLocale(req);
  const { acceptTerms, email } = (await req.json()) as {
    acceptTerms?: boolean;
    email?: string;
  };
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return jsonApiError(locale, "NEWSLETTER_EMAIL_REQUIRED", 400);
  }

  if (!normalizedEmail.includes("@")) {
    return jsonApiError(locale, "NEWSLETTER_INVALID_EMAIL", 400);
  }

  if (acceptTerms !== true) {
    return jsonApiError(locale, "TERMS_NOT_ACCEPTED", 400);
  }

  try {
    const db = getAdminDb();
    let existingSnap = await db
      .collection("newsletter_subscribers")
      .where("emailNormalized", "==", normalizedEmail)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      existingSnap = await db
        .collection("newsletter_subscribers")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();
    }

    if (!existingSnap.empty) {
      const docRef = existingSnap.docs[0].ref;
      await docRef.update({
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        status: "active",
        source: "landing_form",
        consentGranted: true,
        consentCapturedAt: FieldValue.serverTimestamp(),
        consentSource: "landing_form",
        consentTextVersion: "v1",
        consentMethod: "single_opt_in",
        consentWithdrawnAt: null,
        termsAcceptedAt: FieldValue.serverTimestamp(),
        termsVersion: "v1",
        privacyAcceptedAt: FieldValue.serverTimestamp(),
        privacyVersion: "v1",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "already_subscribed" }, { status: 200 });
    }

    await db.collection("newsletter_subscribers").add({
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      status: "active",
      tags: [],
      source: "landing_form",
      consentGranted: true,
      consentCapturedAt: FieldValue.serverTimestamp(),
      consentSource: "landing_form",
      consentTextVersion: "v1",
      consentMethod: "single_opt_in",
      consentWithdrawnAt: null,
      termsAcceptedAt: FieldValue.serverTimestamp(),
      termsVersion: "v1",
      privacyAcceptedAt: FieldValue.serverTimestamp(),
      privacyVersion: "v1",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ status: "subscribed" }, { status: 200 });
  } catch (error) {
    captureServerException(error, { route: "api/newsletter/route.ts" });
    return jsonApiError(locale, "NEWSLETTER_SUBSCRIBE_FAILED", 500);
  }
}

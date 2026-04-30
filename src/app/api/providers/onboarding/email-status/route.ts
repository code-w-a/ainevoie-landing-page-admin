import { NextResponse } from "next/server";
import { getRequestLocale } from "@/lib/apiLocale";
import { jsonApiError } from "@/lib/apiJsonError";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

function normalizeEmail(value?: string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value: string) {
  return value.includes("@");
}

function isAuthUserNotFound(error: unknown) {
  const err = error as { code?: unknown; message?: unknown };
  return (
    err.code === "auth/user-not-found" ||
    (typeof err.message === "string" && err.message.includes("auth/user-not-found"))
  );
}

export async function GET(request: Request) {
  const locale = getRequestLocale(request);
  const { searchParams } = new URL(request.url);
  const email = normalizeEmail(searchParams.get("email"));

  if (!email) {
    return jsonApiError(locale, "MISSING_FIELDS", 400);
  }

  if (!isValidEmail(email)) {
    return jsonApiError(locale, "INVALID_EMAIL", 400);
  }

  try {
    const providerSnap = await getAdminDb()
      .collection("providers")
      .where("emailNormalized", "==", email)
      .limit(1)
      .get();

    if (!providerSnap.empty) {
      return NextResponse.json({ exists: true, source: "provider" }, { status: 200 });
    }

    try {
      await getAdminAuth().getUserByEmail(email);
      return NextResponse.json({ exists: true, source: "auth" }, { status: 200 });
    } catch (error) {
      if (isAuthUserNotFound(error)) {
        return NextResponse.json({ exists: false }, { status: 200 });
      }
      throw error;
    }
  } catch (error) {
    captureServerException(error, {
      route: "api/providers/onboarding/email-status/route.ts",
    });
    return jsonApiError(locale, "SERVER_ERROR", 500);
  }
}

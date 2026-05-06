import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
import { devLogServerError } from "@/lib/devServerErrorLog";
import {
  APP_UPDATE_SETTINGS_COLLECTION,
  APP_UPDATE_SETTINGS_DOC,
  getDefaultAppUpdateSettings,
  sanitizeAppUpdateSettings,
  validateAppUpdateSettings,
} from "@/lib/appUpdateSettings";

export const dynamic = "force-dynamic";

async function loadSettings() {
  const db = getAdminDb();
  const snapshot = await db
    .collection(APP_UPDATE_SETTINGS_COLLECTION)
    .doc(APP_UPDATE_SETTINGS_DOC)
    .get();

  return snapshot.exists
    ? sanitizeAppUpdateSettings(snapshot.data())
    : getDefaultAppUpdateSettings();
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const item = await loadSettings();

    return NextResponse.json({
      item,
      defaults: getDefaultAppUpdateSettings(),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/app-update-settings/route.ts",
    });
    devLogServerError("GET /api/admin/app-update-settings", error);
    return NextResponse.json(
      { error: "Nu am putut încărca setările de actualizare." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const sanitized = sanitizeAppUpdateSettings(body);
    const validationError = validateAppUpdateSettings(sanitized);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const item = {
      ...sanitized,
      revision: `mobile-update-${Date.now()}`,
    };

    const db = getAdminDb();
    await db
      .collection(APP_UPDATE_SETTINGS_COLLECTION)
      .doc(APP_UPDATE_SETTINGS_DOC)
      .set(
        {
          ...item,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({
      item,
      defaults: getDefaultAppUpdateSettings(),
      status: "ok",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/app-update-settings/route.ts",
    });
    devLogServerError("PUT /api/admin/app-update-settings", error);
    return NextResponse.json(
      { error: "Nu am putut salva setările de actualizare." },
      { status: 500 }
    );
  }
}

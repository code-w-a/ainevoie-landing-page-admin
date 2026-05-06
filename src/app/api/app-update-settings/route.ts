import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
import { devLogServerError } from "@/lib/devServerErrorLog";
import {
  APP_UPDATE_SETTINGS_COLLECTION,
  APP_UPDATE_SETTINGS_DOC,
  getDefaultAppUpdateSettings,
  getPublicAppUpdateSettings,
  sanitizeAppUpdateSettings,
} from "@/lib/appUpdateSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(APP_UPDATE_SETTINGS_COLLECTION)
      .doc(APP_UPDATE_SETTINGS_DOC)
      .get();
    const settings = snapshot.exists
      ? sanitizeAppUpdateSettings(snapshot.data())
      : getDefaultAppUpdateSettings();
    const response = NextResponse.json({
      item: getPublicAppUpdateSettings(settings),
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    captureServerException(error, {
      route: "api/app-update-settings/route.ts",
    });
    devLogServerError("GET /api/app-update-settings", error);
    return NextResponse.json(
      {
        item: getPublicAppUpdateSettings(getDefaultAppUpdateSettings()),
      },
      { status: 200 }
    );
  }
}

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { devLogServerError } from "@/lib/devServerErrorLog";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { captureServerException } from "@/lib/sentryServer";

const SETTINGS_DOC = "default";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();
    const doc = await db
      .collection("newsletter_settings")
      .doc(SETTINGS_DOC)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ item: null });
    }

    return NextResponse.json({ item: serializeDoc(doc) });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/settings/route.ts" });
    devLogServerError("GET /api/admin/newsletter/settings", error);
    return NextResponse.json(
      { error: "Nu am putut încărca setările." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const db = getAdminDb();

    await db.collection("newsletter_settings").doc(SETTINGS_DOC).set(
      {
        ...body,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/settings/route.ts" });
    devLogServerError("PUT /api/admin/newsletter/settings", error);
    return NextResponse.json(
      { error: "Nu am putut actualiza setările." },
      { status: 500 }
    );
  }
}

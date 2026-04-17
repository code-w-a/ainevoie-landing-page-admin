import { NextResponse } from "next/server";
import { devLogServerError } from "@/lib/devServerErrorLog";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import {
  mergeSeenDocument,
  normalizeSeenFromUnknown,
  type AdminNotificationsSeen,
} from "@/lib/adminNotificationsSeen";
import { captureServerException } from "@/lib/sentryServer";

const SUB_FIELD = "notificationsSeenSubscriberIds";
const PROV_FIELD = "notificationsSeenProviderIds";

function readSeenFromAdminDoc(data: unknown): AdminNotificationsSeen {
  if (!data || typeof data !== "object") {
    return { subscriberIds: [], providerIds: [] };
  }
  const rec = data as Record<string, unknown>;
  return normalizeSeenFromUnknown({
    subscriberIds: rec[SUB_FIELD],
    providerIds: rec[PROV_FIELD],
  });
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && ["missing_token", "not_admin"].includes(error.message);
}

export async function GET(request: Request) {
  try {
    const decoded = await requireAdmin(request);
    const db = getAdminDb();
    const snap = await db.collection("admini").doc(decoded.uid).get();
    const seen = readSeenFromAdminDoc(snap.data());
    return NextResponse.json(seen);
  } catch (error) {
    captureServerException(error, { route: "api/admin/notifications-seen/route.ts" });
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
    }
    devLogServerError("GET /api/admin/notifications-seen", error);
    return NextResponse.json(
      { error: "Nu am putut încărca starea notificărilor." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const decoded = await requireAdmin(request);
    const body = (await request.json()) as unknown;
    const patch = normalizeSeenFromUnknown(
      body && typeof body === "object" ? (body as Record<string, unknown>) : {}
    );
    const db = getAdminDb();
    const ref = db.collection("admini").doc(decoded.uid);
    const next = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const prev = readSeenFromAdminDoc(snap.data());
      const merged = mergeSeenDocument(prev, patch);
      tx.set(
        ref,
        {
          [SUB_FIELD]: merged.subscriberIds,
          [PROV_FIELD]: merged.providerIds,
        },
        { merge: true }
      );
      return merged;
    });
    return NextResponse.json(next);
  } catch (error) {
    captureServerException(error, { route: "api/admin/notifications-seen/route.ts" });
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
    }
    devLogServerError("PATCH /api/admin/notifications-seen", error);
    return NextResponse.json(
      { error: "Nu am putut salva starea notificărilor." },
      { status: 500 }
    );
  }
}

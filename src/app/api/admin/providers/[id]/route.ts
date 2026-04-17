import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { isProviderStatus } from "@/lib/providers";
import { captureServerException } from "@/lib/sentryServer";

type UpdatePayload = {
  onboardingStatus?: string;
  internalNotes?: string;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    const doc = await db.collection("providers").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Prestatorul nu a fost găsit." }, { status: 404 });
    }

    const eventsSnapshot = await db
      .collection("providers")
      .doc(id)
      .collection("events")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const events = eventsSnapshot.docs
      .map(serializeDoc)
      .filter(Boolean) as Array<Record<string, unknown>>;

    return NextResponse.json({ item: serializeDoc(doc), events });
  } catch (error) {
    captureServerException(error, { route: "api/admin/providers/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca prestatorul." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as UpdatePayload;
    const db = getAdminDb();
    const docRef = db.collection("providers").doc(id);
    const existingDoc = await docRef.get();
    const existingData = existingDoc.data() as { onboardingStatus?: string } | undefined;
    const previousStatus = existingData?.onboardingStatus || "new";

    const payload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    let nextStatus: string | null = null;

    if (typeof body.onboardingStatus === "string") {
      const normalized = body.onboardingStatus.trim().toLowerCase();
      if (!isProviderStatus(normalized)) {
        return NextResponse.json({ error: "Status nevalid." }, { status: 400 });
      }
      payload.onboardingStatus = normalized;
      nextStatus = normalized;
    }

    if (typeof body.internalNotes === "string") {
      payload.internalNotes = body.internalNotes.trim();
    }

    await docRef.set(payload, { merge: true });

    if (nextStatus && nextStatus !== previousStatus) {
      await docRef.collection("events").add({
        type: "status_changed",
        fromStatus: previousStatus,
        toStatus: nextStatus,
        actorUid: decoded.uid,
        note:
          typeof body.internalNotes === "string" && body.internalNotes.trim()
            ? body.internalNotes.trim()
            : null,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ status: "updated" });
  } catch (error) {
    captureServerException(error, { route: "api/admin/providers/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza prestatorul." },
      { status: 500 }
    );
  }
}

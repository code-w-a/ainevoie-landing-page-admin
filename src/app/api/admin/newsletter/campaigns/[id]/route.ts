import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { sanitizePayload } from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();

    await db.collection("newsletter_campaigns").doc(id).update(
      sanitizePayload({
        ...body,
        updatedAt: FieldValue.serverTimestamp(),
      })
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza campania." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    await db.collection("newsletter_campaigns").doc(id).delete();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut șterge campania." },
      { status: 500 }
    );
  }
}

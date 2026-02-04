import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const db = getAdminDb();

    const updates: Record<string, unknown> = {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (typeof body.email === "string") {
      const normalizedEmail = body.email.trim().toLowerCase();
      updates.email = normalizedEmail;
      updates.emailNormalized = normalizedEmail;
    }

    await db
      .collection("newsletter_subscribers")
      .doc(params.id)
      .update(updates);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();
    await db.collection("newsletter_subscribers").doc(params.id).delete();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const paymentId = decodeURIComponent(String(id || "")).trim();

    if (!paymentId) {
      return NextResponse.json({ error: "Payment id este obligatoriu." }, { status: 400 });
    }

    const db = getAdminDb();
    const paymentRef = db.collection("payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return NextResponse.json({ error: "Plata nu există." }, { status: 404 });
    }

    await paymentRef.delete();

    return NextResponse.json({
      ok: true,
      paymentId,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/payments/[id]/route.ts:DELETE" });
    return NextResponse.json(
      { error: "Nu am putut șterge plata." },
      { status: 500 }
    );
  }
}

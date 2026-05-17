import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { id } = await context.params;
    const bookingId = decodeURIComponent(id || "").trim();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking id este obligatoriu." }, { status: 400 });
    }

    const result = await callAdminCallable(
      "getAdminBookingCase",
      { bookingId },
      "Nu am putut încărca programarea.",
      admin.idToken
    );

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/bookings/[id]/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca programarea." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const bookingId = decodeURIComponent(String(id || "")).trim();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking id este obligatoriu." }, { status: 400 });
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Programarea nu există." }, { status: 404 });
    }

    await bookingRef.delete();

    return NextResponse.json({
      ok: true,
      bookingId,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/bookings/[id]/route.ts:DELETE" });
    return NextResponse.json(
      { error: "Nu am putut șterge programarea." },
      { status: 500 }
    );
  }
}

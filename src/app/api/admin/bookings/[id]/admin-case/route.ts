import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

type BookingCasePayload = {
  action?: "cancel" | "update_case";
  reason?: string;
  note?: string;
  resolutionStatus?: "open" | "in_progress" | "resolved";
  linkedTicketIds?: string[];
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const bookingId = decodeURIComponent(String(id || "")).trim();
    const body = (await request.json().catch(() => ({}))) as BookingCasePayload;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking id este obligatoriu." }, { status: 400 });
    }

    const result = await callAdminCallable(
      "adminUpdateBookingCase",
      {
        bookingId,
        action: body.action,
        reason: body.reason,
        note: body.note,
        resolutionStatus: body.resolutionStatus,
        linkedTicketIds: Array.isArray(body.linkedTicketIds) ? body.linkedTicketIds : [],
      },
      "Nu am putut actualiza cazul booking-ului.",
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

    captureServerException(error, { route: "api/admin/bookings/[id]/admin-case/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza cazul booking-ului." },
      { status: 500 }
    );
  }
}

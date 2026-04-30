import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
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

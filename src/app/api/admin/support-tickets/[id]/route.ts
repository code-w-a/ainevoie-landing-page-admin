import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import {
  AdminSupportTicketError,
  patchAdminSupportTicket,
  type SupportTicketPatchPayload,
} from "@/lib/adminSupportTickets";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { id } = await context.params;
    const ticketId = decodeURIComponent(String(id || "")).trim();
    const body = (await request.json().catch(() => ({}))) as SupportTicketPatchPayload;

    const item = await patchAdminSupportTicket(
      ticketId,
      {
        status: body.status,
        priority: body.priority,
        assignedAdminUid: body.assignedAdminUid,
        adminNote: body.adminNote,
        relatedEntity: body.relatedEntity,
      },
      {
        uid: admin.uid,
        role: admin.adminAccessLevel,
      }
    );

    return NextResponse.json({
      item,
      status: "ok",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminSupportTicketError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/support-tickets/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza ticket-ul de suport." },
      { status: 500 }
    );
  }
}

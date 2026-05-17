import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin, requireAdminOrSupport } from "@/lib/adminAuth";
import {
  AdminSupportTicketError,
  deleteAdminSupportTicket,
  getAdminSupportTicketById,
  patchAdminSupportTicket,
  type SupportTicketPatchPayload,
} from "@/lib/adminSupportTickets";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrSupport(request);
    const { id } = await context.params;
    const ticketId = decodeURIComponent(String(id || "")).trim();
    const item = await getAdminSupportTicketById(ticketId);

    return NextResponse.json({
      item,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminSupportTicketError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/support-tickets/[id]/route.ts:GET" });
    return NextResponse.json(
      { error: "Nu am putut încărca ticket-ul de suport." },
      { status: 500 }
    );
  }
}

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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const ticketId = decodeURIComponent(String(id || "")).trim();
    const result = await deleteAdminSupportTicket(ticketId);

    return NextResponse.json({
      ok: true,
      ticketId: result.ticketId,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminSupportTicketError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/support-tickets/[id]/route.ts:DELETE" });
    return NextResponse.json(
      { error: "Nu am putut șterge ticket-ul de suport." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import {
  AdminConversationError,
  patchAdminConversationModeration,
  type ConversationModerationPayload,
} from "@/lib/adminConversations";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { id } = await context.params;
    const conversationId = decodeURIComponent(String(id || "")).trim();
    const body = (await request.json().catch(() => ({}))) as ConversationModerationPayload;

    const item = await patchAdminConversationModeration(
      conversationId,
      {
        status: body.status,
        note: body.note,
      },
      {
        uid: admin.uid,
        role: admin.adminAccessLevel,
      }
    );

    return NextResponse.json({ item, status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/conversations/[id]/moderation/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza moderarea conversației." },
      { status: 500 }
    );
  }
}

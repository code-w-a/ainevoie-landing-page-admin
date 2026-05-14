import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import {
  AdminConversationError,
  patchAdminConversationParticipantBlock,
  type ConversationParticipantBlockPayload,
} from "@/lib/adminConversations";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { id, uid } = await context.params;
    const conversationId = decodeURIComponent(String(id || "")).trim();
    const participantUid = decodeURIComponent(String(uid || "")).trim();
    const body = (await request.json().catch(() => ({}))) as ConversationParticipantBlockPayload;

    const participant = await patchAdminConversationParticipantBlock(
      conversationId,
      participantUid,
      {
        blocked: body.blocked,
        reason: body.reason,
      },
      {
        uid: admin.uid,
        role: admin.adminAccessLevel,
      }
    );

    return NextResponse.json({ participant, status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/conversations/[id]/participants/[uid]/block/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza block-ul participantului." },
      { status: 500 }
    );
  }
}

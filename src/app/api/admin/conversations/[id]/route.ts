import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminConversationError, getAdminConversationDetail } from "@/lib/adminConversations";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrSupport(request);
    const { id } = await context.params;
    const conversationId = decodeURIComponent(String(id || "")).trim();
    const result = await getAdminConversationDetail(conversationId);
    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/conversations/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca detaliile conversației." },
      { status: 500 }
    );
  }
}

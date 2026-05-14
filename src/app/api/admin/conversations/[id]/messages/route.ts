import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminConversationError, listAdminConversationMessages } from "@/lib/adminConversations";
import { captureServerException } from "@/lib/sentryServer";

function readPositiveNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrSupport(request);
    const { id } = await context.params;
    const conversationId = decodeURIComponent(String(id || "")).trim();
    const { searchParams } = new URL(request.url);

    const result = await listAdminConversationMessages(conversationId, {
      limit: readPositiveNumber(searchParams.get("limit"), 30, 100),
      cursor: searchParams.get("cursor"),
    });

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/conversations/[id]/messages/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca mesajele conversației." },
      { status: 500 }
    );
  }
}

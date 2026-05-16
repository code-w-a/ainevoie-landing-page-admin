import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminConversationError, listAdminConversations } from "@/lib/adminConversations";
import { captureServerException } from "@/lib/sentryServer";

function readPositiveNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

export async function GET(request: Request) {
  try {
    await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);

    const result = await listAdminConversations(
      {
        status: searchParams.get("status")?.trim() || undefined,
        type: searchParams.get("type")?.trim() || undefined,
        moderationStatus: searchParams.get("moderationStatus")?.trim() || undefined,
        userId: searchParams.get("userId")?.trim() || undefined,
        providerId: searchParams.get("providerId")?.trim() || undefined,
        conversationId: searchParams.get("conversationId")?.trim() || undefined,
        bookingId: searchParams.get("bookingId")?.trim() || undefined,
        q: searchParams.get("q")?.trim() || undefined,
      },
      {
        limit: readPositiveNumber(searchParams.get("limit"), 20, 100),
        cursor: searchParams.get("cursor"),
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminConversationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/conversations/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca conversațiile." },
      { status: 500 }
    );
  }
}

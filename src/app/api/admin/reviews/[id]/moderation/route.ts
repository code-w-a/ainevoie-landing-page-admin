import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import {
  AdminReviewError,
  moderateAdminReview,
  type ReviewModerationPayload,
} from "@/lib/adminReviews";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const reviewId = decodeURIComponent(String(id || "")).trim();
    const body = (await request.json().catch(() => ({}))) as ReviewModerationPayload;
    const status = body.status ? String(body.status).trim() : undefined;
    const note = body.note !== undefined ? String(body.note || "") : undefined;

    const item = await moderateAdminReview(
      reviewId,
      {
        status: status as ReviewModerationPayload["status"],
        note,
      },
      { uid: admin.uid }
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

    if (error instanceof AdminReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/reviews/[id]/moderation/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut salva moderarea review-ului." },
      { status: 500 }
    );
  }
}

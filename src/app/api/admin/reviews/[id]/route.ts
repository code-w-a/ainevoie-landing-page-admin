import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminReviewError, deleteAdminReview } from "@/lib/adminReviews";
import { captureServerException } from "@/lib/sentryServer";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const reviewId = decodeURIComponent(String(id || "")).trim();
    const result = await deleteAdminReview(reviewId, { uid: admin.uid });

    return NextResponse.json({
      ok: true,
      reviewId: result.reviewId,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/reviews/[id]/route.ts:DELETE" });
    return NextResponse.json(
      { error: "Nu am putut șterge review-ul." },
      { status: 500 }
    );
  }
}

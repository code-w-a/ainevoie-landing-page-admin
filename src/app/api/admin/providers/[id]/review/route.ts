import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

const REVIEW_ACTIONS = ["approve", "reject", "suspend", "reinstate"] as const;
type ReviewAction = (typeof REVIEW_ACTIONS)[number];

function isReviewAction(value: unknown): value is ReviewAction {
  return typeof value === "string" && REVIEW_ACTIONS.includes(value as ReviewAction);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    console.info("[admin-provider-review] review request", {
      adminUid: admin.uid,
      providerId: id,
      action,
      hasReason: Boolean(reason),
    });

    if (!isReviewAction(action)) {
      console.warn("[admin-provider-review] invalid action", {
        providerId: id,
        action,
      });
      return NextResponse.json({ error: "Acțiune nevalidă." }, { status: 400 });
    }

    if ((action === "reject" || action === "suspend") && !reason) {
      console.warn("[admin-provider-review] missing reason", {
        providerId: id,
        action,
      });
      return NextResponse.json(
        { error: "Motivul este obligatoriu pentru respingere sau suspendare." },
        { status: 400 }
      );
    }

    const result = await callAdminCallable(
      "adminReviewProvider",
      {
        providerId: id,
        action,
        reason: reason || undefined,
        adminUid: admin.uid,
      },
      "Nu am putut procesa decizia pentru prestator.",
      admin.idToken
    );

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      console.error("[admin-provider-review] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin-provider-review] route error", error);
    captureServerException(error, { route: "api/admin/providers/[id]/review/route.ts" });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut procesa decizia pentru prestator.",
      },
      { status: 500 }
    );
  }
}

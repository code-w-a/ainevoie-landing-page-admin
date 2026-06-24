import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await callAdminCallable<{ subscription: Record<string, unknown> | null }>(
      "adminSetSubscriptionStatus",
      { subscriptionId: id, status: body?.status },
      "Nu am putut actualiza abonamentul.",
      admin.idToken
    );

    return NextResponse.json({ subscription: result.subscription, status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/subscriptions/[id]/status/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut actualiza abonamentul." },
      { status: 500 }
    );
  }
}

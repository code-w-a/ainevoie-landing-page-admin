import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { markProviderPayoutRequestPaid } from "@/lib/adminPayments";
import { captureServerException } from "@/lib/sentryServer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await markProviderPayoutRequestPaid({
      requestId: id,
      adminUid: admin.uid,
      adminNote: body?.adminNote,
    });

    return NextResponse.json({ item: result, status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    const message = error instanceof Error ? error.message : "";
    if (message === "payout_request_not_found") {
      return NextResponse.json({ error: "Cererea de payout nu există." }, { status: 404 });
    }
    if (message === "payout_request_not_requested" || message === "payout_payment_not_requested") {
      return NextResponse.json({ error: "Cererea de payout nu mai este în status requested." }, { status: 409 });
    }

    captureServerException(error, {
      route: "api/admin/provider-payout-requests/[id]/mark-paid/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut marca payout-ul ca plătit." },
      { status: 500 }
    );
  }
}

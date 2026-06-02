import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { listAdminProviderPayoutRequests } from "@/lib/adminPayments";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(request: Request) {
  try {
    await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || undefined;

    const items = await listAdminProviderPayoutRequests({
      status: status === "all" ? undefined : status,
      maxRows: 200,
    });

    return NextResponse.json({ items });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/provider-payout-requests/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca cererile de payout." },
      { status: 500 }
    );
  }
}

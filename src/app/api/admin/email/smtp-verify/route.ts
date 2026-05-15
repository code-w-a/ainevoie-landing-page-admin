import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { verifySmtpConnection } from "@/lib/email";
import { captureServerException } from "@/lib/sentryServer";

const ROUTE_TAG = "[admin-smtp-verify]";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    console.info(`${ROUTE_TAG} verify_request`, {
      adminUid: admin.uid,
    });

    const result = await verifySmtpConnection();
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    console.error(`${ROUTE_TAG} verify_route_error`, error);
    captureServerException(error, { route: "api/admin/email/smtp-verify/route.ts" });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "SMTP verify failed.",
      },
      { status: 500 }
    );
  }
}

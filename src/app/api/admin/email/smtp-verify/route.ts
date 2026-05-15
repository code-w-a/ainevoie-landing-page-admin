import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { verifySmtpConnection } from "@/lib/email";
import { captureServerException } from "@/lib/sentryServer";

const ROUTE_TAG = "[admin-smtp-verify]";

function hasValidAdminApiKey(request: Request) {
  const configuredApiKey = process.env.ADMIN_API_KEY?.trim();
  if (!configuredApiKey) {
    return false;
  }

  const headerApiKey = request.headers.get("x-admin-api-key")?.trim();
  if (!headerApiKey) {
    return false;
  }

  return headerApiKey === configuredApiKey;
}

export async function POST(request: Request) {
  try {
    const hasApiKeyAccess = hasValidAdminApiKey(request);
    let adminUid: string | null = null;
    let authSource: "admin_api_key" | "firebase_admin_token" = "admin_api_key";

    if (!hasApiKeyAccess) {
      const admin = await requireAdmin(request);
      adminUid = admin.uid;
      authSource = "firebase_admin_token";
    }

    console.info(`${ROUTE_TAG} verify_request`, {
      adminUid,
      authSource,
      hasApiKeyAccess,
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

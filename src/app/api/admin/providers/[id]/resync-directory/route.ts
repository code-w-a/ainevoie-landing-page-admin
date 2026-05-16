import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const providerId = decodeURIComponent(String(id || "")).trim();

    if (!providerId) {
      return NextResponse.json({ error: "Provider id este obligatoriu." }, { status: 400 });
    }

    const result = await callAdminCallable(
      "adminResyncProviderDirectory",
      {
        providerId,
        limit: 1,
      },
      "Nu am putut resincroniza snapshot-ul public al prestatorului.",
      admin.idToken
    );

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/providers/[id]/resync-directory/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut resincroniza snapshot-ul public al prestatorului." },
      { status: 500 }
    );
  }
}

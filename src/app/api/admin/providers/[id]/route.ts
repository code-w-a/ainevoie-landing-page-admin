import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;

    console.info("[admin-provider-case] detail request", {
      adminUid: admin.uid,
      providerId: id,
    });

    const result = await callAdminCallable(
      "getAdminProviderCase",
      {
        providerId: id,
      },
      "Nu am putut încărca prestatorul.",
      admin.idToken
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminCallableError) {
      console.error("[admin-provider-case] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin-provider-case] route error", error);
    captureServerException(error, { route: "api/admin/providers/[id]/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca prestatorul." },
      { status: 500 }
    );
  }
}

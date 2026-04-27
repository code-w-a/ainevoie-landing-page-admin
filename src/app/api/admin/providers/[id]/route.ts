import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const result = await callAdminCallable("getAdminProviderCase", {
      providerId: id,
    }, "Nu am putut încărca prestatorul.");

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/providers/[id]/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca prestatorul." },
      { status: 500 }
    );
  }
}

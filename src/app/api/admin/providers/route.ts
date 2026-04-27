import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

function readPositiveNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const filters = {
      page: readPositiveNumber(searchParams.get("page"), 1, 10_000),
      pageSize: readPositiveNumber(searchParams.get("pageSize"), 20, 100),
      q: searchParams.get("q")?.trim() || undefined,
      status: searchParams.get("status")?.trim() || undefined,
      countyCode: searchParams.get("countyCode")?.trim() || undefined,
      cityCode: searchParams.get("cityCode")?.trim() || undefined,
      serviceType: searchParams.get("serviceType")?.trim() || undefined,
    };

    console.info("[admin-providers] list request", {
      adminUid: admin.uid,
      filters,
    });

    const result = await callAdminCallable(
      "listAdminProviders",
      filters,
      "Nu am putut încărca prestatorii.",
      admin.idToken
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminCallableError) {
      console.error("[admin-providers] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin-providers] route error", error);
    captureServerException(error, { route: "api/admin/providers/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca prestatorii." },
      { status: 500 }
    );
  }
}

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
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const result = await callAdminCallable("listAdminProviders", {
      page: readPositiveNumber(searchParams.get("page"), 1, 10_000),
      pageSize: readPositiveNumber(searchParams.get("pageSize"), 20, 100),
      q: searchParams.get("q")?.trim() || undefined,
      status: searchParams.get("status")?.trim() || undefined,
      countyCode: searchParams.get("countyCode")?.trim() || undefined,
      cityCode: searchParams.get("cityCode")?.trim() || undefined,
      serviceType: searchParams.get("serviceType")?.trim() || undefined,
    }, "Nu am putut încărca prestatorii.");

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/providers/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca prestatorii." },
      { status: 500 }
    );
  }
}

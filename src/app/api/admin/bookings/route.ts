import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
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
    const admin = await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const page = readPositiveNumber(searchParams.get("page"), 1, 10_000);
    const pageSize = readPositiveNumber(searchParams.get("pageSize"), 20, 100);
    const limit = Math.min(page * pageSize, 100);
    const filters = {
      limit,
      search: searchParams.get("q")?.trim() || undefined,
      status: searchParams.get("status")?.trim() || undefined,
      paymentStatus: searchParams.get("paymentStatus")?.trim() || undefined,
      providerId: searchParams.get("providerId")?.trim() || undefined,
      userId: searchParams.get("userId")?.trim() || undefined,
    };

    const result = await callAdminCallable<{
      total: number;
      items: Array<Record<string, unknown>>;
    }>(
      "listAdminBookings",
      filters,
      "Nu am putut încărca programările.",
      admin.idToken
    );
    const start = (page - 1) * pageSize;
    const items = (result.items || []).slice(start, start + pageSize);
    const total = Number(result.total) || items.length;

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/bookings/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca programările." },
      { status: 500 }
    );
  }
}

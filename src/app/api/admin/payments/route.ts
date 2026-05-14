import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { listAdminPayments } from "@/lib/adminPayments";
import { captureServerException } from "@/lib/sentryServer";

function readPositiveNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

function readDateFromParam(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readDateToParam(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T23:59:59.999Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: Request) {
  try {
    await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const page = readPositiveNumber(searchParams.get("page"), 1, 10_000);
    const pageSize = readPositiveNumber(searchParams.get("pageSize"), 20, 100);

    const result = await listAdminPayments(
      {
        status: searchParams.get("status")?.trim() || undefined,
        dateFrom: readDateFromParam(searchParams.get("dateFrom")),
        dateTo: readDateToParam(searchParams.get("dateTo")),
        providerId: searchParams.get("providerId")?.trim() || undefined,
        userId: searchParams.get("userId")?.trim() || undefined,
        processorId: searchParams.get("processorId")?.trim() || undefined,
        q: searchParams.get("q")?.trim() || undefined,
      },
      { maxRows: 5000 }
    );

    const start = (page - 1) * pageSize;
    const items = result.items.slice(start, start + pageSize);
    const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages,
      },
      meta: {
        truncated: result.truncated,
        maxRows: result.maxRows,
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/payments/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca plățile." },
      { status: 500 }
    );
  }
}

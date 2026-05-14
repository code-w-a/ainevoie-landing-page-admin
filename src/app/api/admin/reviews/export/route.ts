import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminReviewError, listAdminReviews, type ReviewAdminListItem } from "@/lib/adminReviews";
import { captureServerException } from "@/lib/sentryServer";

const CSV_MAX_ROWS = 5000;

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

function readOptionalNumber(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function toCsv(items: ReviewAdminListItem[]) {
  const headers = [
    "reviewId",
    "bookingId",
    "status",
    "rating",
    "review",
    "createdAt",
    "updatedAt",
    "providerId",
    "providerName",
    "providerEmail",
    "authorUserId",
    "userName",
    "userEmail",
    "serviceName",
    "bookingStatus",
    "bookingStartAt",
    "adminNote",
    "adminModerationUpdatedBy",
    "adminModerationUpdatedAt",
  ];

  const rows = items.map((item) =>
    [
      item.reviewId,
      item.bookingId,
      item.status,
      item.rating,
      item.review,
      item.createdAt,
      item.updatedAt,
      item.providerId,
      item.provider?.displayName,
      item.provider?.email,
      item.authorUserId,
      item.user?.displayName || item.authorSnapshot.displayName,
      item.user?.email,
      item.serviceSnapshot.serviceName,
      item.booking?.status,
      item.booking?.scheduledStartAt,
      item.adminModeration.note,
      item.adminModeration.updatedBy,
      item.adminModeration.updatedAt,
    ]
      .map(csvEscape)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function GET(request: Request) {
  try {
    await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);

    const result = await listAdminReviews(
      {
        status: searchParams.get("status")?.trim() || undefined,
        providerId: searchParams.get("providerId")?.trim() || undefined,
        userId: searchParams.get("userId")?.trim() || undefined,
        ratingMin: readOptionalNumber(searchParams.get("ratingMin")),
        ratingMax: readOptionalNumber(searchParams.get("ratingMax")),
        dateFrom: readDateFromParam(searchParams.get("dateFrom")),
        dateTo: readDateToParam(searchParams.get("dateTo")),
        q: searchParams.get("q")?.trim() || undefined,
      },
      { maxRows: CSV_MAX_ROWS }
    );

    if (result.truncated) {
      return NextResponse.json(
        { error: `Exportul depaseste limita de ${CSV_MAX_ROWS} randuri. Restrange filtrele.` },
        { status: 400 }
      );
    }

    const csv = toCsv(result.items);
    const fileName = `admin-reviews-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/reviews/export/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut exporta review-urile." },
      { status: 500 }
    );
  }
}

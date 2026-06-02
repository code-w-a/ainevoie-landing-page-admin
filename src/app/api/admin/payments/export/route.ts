import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { listAdminPayments, type PaymentAdminListItem } from "@/lib/adminPayments";
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

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function toAmountDisplay(item: PaymentAdminListItem) {
  if (!Number.isFinite(item.amount) || item.amount <= 0) {
    return "";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: item.currency || "RON",
  }).format(item.amount);
}

function toMoney(value: number, currency: string) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency || "RON",
  }).format(value);
}

function toCsv(items: PaymentAdminListItem[]) {
  const headers = [
    "paymentId",
    "status",
    "createdAt",
    "amount",
    "grossAmount",
    "platformFeePercent",
    "platformFeeAmount",
    "providerNetAmount",
    "providerPayoutStatus",
    "providerPayoutRequestedAt",
    "providerPayoutPaidAt",
    "currency",
    "amountDisplay",
    "providerNetDisplay",
    "processor",
    "method",
    "last4",
    "transactionId",
    "stripePaymentIntentId",
    "stripeLatestChargeId",
    "stripeStatus",
    "webhookEventId",
    "webhookState",
    "bookingId",
    "bookingStatus",
    "scheduledStartAt",
    "userId",
    "userName",
    "userEmail",
    "providerId",
    "providerName",
    "providerEmail",
  ];

  const rows = items.map((item) =>
    [
      item.paymentId,
      item.status,
      item.createdAt,
      item.amount,
      item.grossAmount,
      item.platformFeePercent,
      item.platformFeeAmount,
      item.providerNetAmount,
      item.providerPayoutStatus,
      item.providerPayoutRequestedAt,
      item.providerPayoutPaidAt,
      item.currency,
      toAmountDisplay(item),
      toMoney(item.providerNetAmount, item.currency),
      item.processor,
      item.method,
      item.last4,
      item.transactionId,
      item.stripePaymentIntentId,
      item.stripeLatestChargeId,
      item.stripeStatus,
      item.webhookEventId,
      item.webhookState,
      item.bookingId,
      item.booking.status,
      item.booking.scheduledStartAt,
      item.userId,
      item.user.displayName,
      item.user.email,
      item.providerId,
      item.provider.displayName,
      item.provider.email,
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

    const result = await listAdminPayments(
      {
        status: searchParams.get("status")?.trim() || undefined,
        providerPayoutStatus: searchParams.get("providerPayoutStatus")?.trim() || undefined,
        dateFrom: readDateFromParam(searchParams.get("dateFrom")),
        dateTo: readDateToParam(searchParams.get("dateTo")),
        providerId: searchParams.get("providerId")?.trim() || undefined,
        userId: searchParams.get("userId")?.trim() || undefined,
        processorId: searchParams.get("processorId")?.trim() || undefined,
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
    const fileName = `admin-payments-${new Date().toISOString().slice(0, 10)}.csv`;

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

    captureServerException(error, { route: "api/admin/payments/export/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut exporta platile." },
      { status: 500 }
    );
  }
}

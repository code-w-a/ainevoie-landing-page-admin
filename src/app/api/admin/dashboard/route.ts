import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

type AdminListResponse = {
  total?: number;
  items?: Array<Record<string, unknown>>;
};

const DASHBOARD_ROUTE = "api/admin/dashboard/route.ts";

function listItems(response: AdminListResponse) {
  return Array.isArray(response.items) ? response.items : [];
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminOrSupport(request);

    console.info("[admin-dashboard] aggregate request", {
      adminUid: admin.uid,
      surface: "admin_dashboard",
    });

    const [
      summary,
      pendingProviders,
      requestedBookings,
      rescheduleBookings,
      failedPaymentBookings,
      recentAuditEvents,
    ] = await Promise.all([
      callAdminCallable<Record<string, unknown>>(
        "getAdminDashboardSummary",
        {},
        "Nu am putut încărca sumarul operațional.",
        admin.idToken
      ),
      callAdminCallable<AdminListResponse>(
        "listAdminProviders",
        { status: "pending_review", limit: 5 },
        "Nu am putut încărca prestatorii în review.",
        admin.idToken
      ),
      callAdminCallable<AdminListResponse>(
        "listAdminBookings",
        { status: "requested", limit: 5 },
        "Nu am putut încărca cererile de programare.",
        admin.idToken
      ),
      callAdminCallable<AdminListResponse>(
        "listAdminBookings",
        { status: "reschedule_proposed", limit: 5 },
        "Nu am putut încărca reprogramările.",
        admin.idToken
      ),
      callAdminCallable<AdminListResponse>(
        "listAdminBookings",
        { paymentStatus: "failed", limit: 5 },
        "Nu am putut încărca plățile eșuate.",
        admin.idToken
      ),
      callAdminCallable<AdminListResponse>(
        "listAdminAuditEvents",
        { limit: 6 },
        "Nu am putut încărca auditul recent.",
        admin.idToken
      ),
    ]);

    const responseBody = {
      generatedAt: new Date().toISOString(),
      summary,
      queues: {
        pendingProviders: {
          total: Number(pendingProviders.total) || listItems(pendingProviders).length,
          items: listItems(pendingProviders),
        },
        requestedBookings: {
          total: Number(requestedBookings.total) || listItems(requestedBookings).length,
          items: listItems(requestedBookings),
        },
        rescheduleBookings: {
          total: Number(rescheduleBookings.total) || listItems(rescheduleBookings).length,
          items: listItems(rescheduleBookings),
        },
        failedPaymentBookings: {
          total: Number(failedPaymentBookings.total) || listItems(failedPaymentBookings).length,
          items: listItems(failedPaymentBookings),
        },
      },
      recentAuditEvents: {
        total: Number(recentAuditEvents.total) || listItems(recentAuditEvents).length,
        items: listItems(recentAuditEvents),
      },
    };

    console.info("[admin-dashboard] aggregate success", {
      adminUid: admin.uid,
      pendingProviders: responseBody.queues.pendingProviders.items.length,
      requestedBookings: responseBody.queues.requestedBookings.items.length,
      rescheduleBookings: responseBody.queues.rescheduleBookings.items.length,
      failedPaymentBookings: responseBody.queues.failedPaymentBookings.items.length,
      recentAuditEvents: responseBody.recentAuditEvents.items.length,
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      console.error("[admin-dashboard] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin-dashboard] route error", error);
    captureServerException(error, { route: DASHBOARD_ROUTE });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca dashboardul." },
      { status: 500 }
    );
  }
}

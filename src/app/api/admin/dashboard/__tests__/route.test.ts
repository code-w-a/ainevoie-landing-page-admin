import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/adminAuth", () => ({
  requireAdminOrSupport: vi.fn().mockResolvedValue({
    uid: "admin-uid",
    idToken: "admin-token",
  }),
  adminAuthErrorResponse: vi.fn((error: unknown) =>
    error instanceof Error && error.message === "not_admin"
      ? Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
      : null
  ),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: vi.fn(),
}));

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function callableNameFromUrl(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input.toString();
  return url.split("/").pop() || "";
}

function bodyFromCall(init?: RequestInit) {
  return JSON.parse(String(init?.body || "{}"));
}

describe("admin dashboard route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_REGION", "europe-west1");
    vi.stubEnv("ADMIN_API_KEY", "admin-secret");
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const callableName = callableNameFromUrl(input);
      if (callableName === "getAdminDashboardSummary") {
        return jsonResponse({
          result: {
            totals: { providers: 2, bookings: 3, payments: 1, reviews: 4, auditEvents: 5 },
            pendingProviderReviewCount: 1,
            openBookingIssueCount: 2,
          },
        });
      }
      if (callableName === "listAdminProviders") {
        return jsonResponse({ result: { total: 1, items: [{ providerId: "provider-1" }] } });
      }
      if (callableName === "listAdminBookings") {
        return jsonResponse({ result: { total: 1, items: [{ bookingId: "booking-1" }] } });
      }
      if (callableName === "listAdminAuditEvents") {
        return jsonResponse({ result: { total: 1, items: [{ eventId: "event-1" }] } });
      }
      return jsonResponse({ result: {} });
    }) as typeof fetch);
  });

  it("aggregates dashboard callable data with stable queue payloads", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/dashboard"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.summary.totals.providers).toBe(2);
    expect(json.queues.pendingProviders.items).toEqual([{ providerId: "provider-1" }]);
    expect(json.queues.requestedBookings.items).toEqual([{ bookingId: "booking-1" }]);
    expect(json.queues.rescheduleBookings.items).toEqual([{ bookingId: "booking-1" }]);
    expect(json.queues.failedPaymentBookings.items).toEqual([{ bookingId: "booking-1" }]);
    expect(json.recentAuditEvents.items).toEqual([{ eventId: "event-1" }]);
    expect(json.generatedAt).toEqual(expect.any(String));
  });

  it("sends the expected callable payloads", async () => {
    const { GET } = await import("../route");
    await GET(new Request("https://example.com/api/admin/dashboard"));

    const calls = vi.mocked(fetch).mock.calls.map(([url, init]) => ({
      name: callableNameFromUrl(url),
      body: bodyFromCall(init),
    }));

    expect(calls).toEqual(
      expect.arrayContaining([
        {
          name: "getAdminDashboardSummary",
          body: { data: { adminApiKey: "admin-secret" } },
        },
        {
          name: "listAdminProviders",
          body: {
            data: {
              status: "pending_review",
              limit: 5,
              adminApiKey: "admin-secret",
            },
          },
        },
        {
          name: "listAdminBookings",
          body: {
            data: {
              status: "requested",
              limit: 5,
              adminApiKey: "admin-secret",
            },
          },
        },
        {
          name: "listAdminBookings",
          body: {
            data: {
              status: "reschedule_proposed",
              limit: 5,
              adminApiKey: "admin-secret",
            },
          },
        },
        {
          name: "listAdminBookings",
          body: {
            data: {
              paymentStatus: "failed",
              limit: 5,
              adminApiKey: "admin-secret",
            },
          },
        },
        {
          name: "listAdminAuditEvents",
          body: { data: { limit: 6, adminApiKey: "admin-secret" } },
        },
      ])
    );
  });

  it("returns 403 without calling Firebase when admin access is missing", async () => {
    const adminAuth = await import("@/lib/adminAuth");
    vi.mocked(adminAuth.requireAdminOrSupport).mockRejectedValueOnce(new Error("not_admin"));

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/dashboard"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Nu ai drepturi de administrator pentru acest cont.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("propagates callable errors without reporting them to Sentry", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const callableName = callableNameFromUrl(input);
      if (callableName === "getAdminDashboardSummary") {
        return jsonResponse({ error: { message: "Dashboard unavailable" } }, 503);
      }
      return jsonResponse({ result: { total: 0, items: [] } });
    }) as typeof fetch);

    const sentry = await import("@/lib/sentryServer");
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/dashboard"));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe("Dashboard unavailable");
    expect(sentry.captureServerException).not.toHaveBeenCalled();
  });

  it("captures unexpected errors in Sentry", async () => {
    vi.stubGlobal("fetch", vi.fn(() => {
      throw new Error("network down");
    }) as typeof fetch);

    const sentry = await import("@/lib/sentryServer");
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/dashboard"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("network down");
    expect(sentry.captureServerException).toHaveBeenCalledWith(
      expect.any(Error),
      { route: "api/admin/dashboard/route.ts" }
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, any>;

class FakeAdminCallableError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AdminCallableError";
    this.status = status;
  }
}

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireAdminOrSupport: vi.fn(),
  adminAuthErrorResponse: vi.fn(),
  callAdminCallable: vi.fn(),
  captureServerException: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: mocks.requireAdmin,
  requireAdminOrSupport: mocks.requireAdminOrSupport,
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));

vi.mock("@/lib/adminCallables", () => ({
  AdminCallableError: FakeAdminCallableError,
  callAdminCallable: mocks.callAdminCallable,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

function buildSubscriptions(): AnyRecord[] {
  return [
    {
      subscriptionId: "sub_1",
      userId: "user_1",
      providerId: "provider_1",
      frequency: "weekly",
      status: "active",
      nextScheduledDateKey: "2026-06-22",
      occurrenceCount: 2,
    },
    {
      subscriptionId: "sub_2",
      userId: "user_2",
      providerId: "provider_2",
      frequency: "monthly",
      status: "paused",
      nextScheduledDateKey: "2026-07-01",
      occurrenceCount: 1,
    },
  ];
}

describe("admin subscriptions routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ uid: "admin-1", idToken: "token-admin" });
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "support-1", idToken: "token-support" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("lists subscriptions with pagination metadata", async () => {
    mocks.callAdminCallable.mockResolvedValueOnce({
      items: buildSubscriptions(),
      total: 2,
    });

    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/subscriptions?page=1&pageSize=20&status=active")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(2);
    expect(json.pagination).toEqual(
      expect.objectContaining({ page: 1, pageSize: 20, total: 2, totalPages: 1 })
    );
    expect(mocks.callAdminCallable).toHaveBeenCalledWith(
      "listAdminSubscriptions",
      expect.objectContaining({ status: "active", limit: 20 }),
      expect.any(String),
      "token-support"
    );
  });

  it("returns auth response when the account is not authorized", async () => {
    mocks.requireAdminOrSupport.mockRejectedValueOnce(new Error("not_admin"));
    mocks.adminAuthErrorResponse.mockReturnValueOnce(
      Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/subscriptions"));

    expect(response.status).toBe(403);
  });

  it("propagates callable errors with their status", async () => {
    mocks.callAdminCallable.mockRejectedValueOnce(
      new FakeAdminCallableError("Nu am putut încărca abonamentele.", 502)
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/subscriptions"));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toContain("abonamente");
  });

  it("updates subscription status via the admin callable", async () => {
    mocks.callAdminCallable.mockResolvedValueOnce({
      subscription: { subscriptionId: "sub_1", status: "cancelled" },
    });

    const { POST } = await import("../[id]/status/route");
    const response = await POST(
      new Request("https://example.com/api/admin/subscriptions/sub_1/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      }),
      { params: Promise.resolve({ id: "sub_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("ok");
    expect(json.subscription).toEqual({ subscriptionId: "sub_1", status: "cancelled" });
    expect(mocks.callAdminCallable).toHaveBeenCalledWith(
      "adminSetSubscriptionStatus",
      { subscriptionId: "sub_1", status: "cancelled" },
      expect.any(String),
      "token-admin"
    );
  });

  it("requires admin (not support) to change subscription status", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("not_admin"));
    mocks.adminAuthErrorResponse.mockReturnValueOnce(
      Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
    );

    const { POST } = await import("../[id]/status/route");
    const response = await POST(
      new Request("https://example.com/api/admin/subscriptions/sub_1/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      }),
      { params: Promise.resolve({ id: "sub_1" }) }
    );

    expect(response.status).toBe(403);
    expect(mocks.callAdminCallable).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminOrSupport: vi.fn(),
  adminAuthErrorResponse: vi.fn(),
  callAdminCallable: vi.fn(),
  captureServerException: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdminOrSupport: mocks.requireAdminOrSupport,
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));

vi.mock("@/lib/adminCallables", () => ({
  AdminCallableError: class AdminCallableError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  callAdminCallable: mocks.callAdminCallable,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

describe("GET /api/admin/bookings", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "admin_1", idToken: "token" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
    mocks.callAdminCallable.mockResolvedValue({
      total: 3,
      items: [
        { bookingId: "bk_1", status: "requested", paymentStatus: "unpaid" },
        { bookingId: "bk_2", status: "confirmed", paymentStatus: "paid" },
        { bookingId: "bk_3", status: "rejected", paymentStatus: "failed" },
      ],
    });
  });

  it("passes filters to listAdminBookings and paginates the response", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/bookings?page=1&pageSize=2&q=cleaning&status=confirmed&paymentStatus=paid&providerId=provider_1&userId=user_1")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.callAdminCallable).toHaveBeenCalledWith(
      "listAdminBookings",
      {
        limit: 2,
        search: "cleaning",
        status: "confirmed",
        paymentStatus: "paid",
        providerId: "provider_1",
        userId: "user_1",
      },
      "Nu am putut încărca programările.",
      "token"
    );
    expect(json).toEqual({
      items: [
        { bookingId: "bk_1", status: "requested", paymentStatus: "unpaid" },
        { bookingId: "bk_2", status: "confirmed", paymentStatus: "paid" },
      ],
      pagination: {
        page: 1,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      },
    });
  });
});

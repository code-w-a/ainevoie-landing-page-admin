import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireAdminOrSupport: vi.fn(),
  adminAuthErrorResponse: vi.fn(),
  callAdminCallable: vi.fn(),
  captureServerException: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: mocks.requireAdmin,
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

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: mocks.getAdminDb,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

describe("GET /api/admin/bookings/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ uid: "admin_1" });
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "admin_1", idToken: "token" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
    mocks.callAdminCallable.mockResolvedValue({
      booking: {
        bookingId: "bk_1",
        status: "confirmed",
        paymentSummary: { status: "paid" },
      },
      payment: { paymentId: "pay_bk_1", status: "paid" },
      conversation: { conversationId: "conv_bk_1" },
      recentAuditEvents: [{ action: "booking.confirm" }],
    });
  });

  it("loads the admin booking case by booking id", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/bookings/bk_1"),
      { params: Promise.resolve({ id: "bk_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.callAdminCallable).toHaveBeenCalledWith(
      "getAdminBookingCase",
      { bookingId: "bk_1" },
      "Nu am putut încărca programarea.",
      "token"
    );
    expect(json).toEqual(expect.objectContaining({
      booking: expect.objectContaining({
        bookingId: "bk_1",
        status: "confirmed",
      }),
      payment: expect.objectContaining({
        paymentId: "pay_bk_1",
        status: "paid",
      }),
      conversation: expect.objectContaining({
        conversationId: "conv_bk_1",
      }),
    }));
  });

  it("returns 400 when booking id is missing", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/bookings/%20"),
      { params: Promise.resolve({ id: " " }) }
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Booking id este obligatoriu.");
  });
});

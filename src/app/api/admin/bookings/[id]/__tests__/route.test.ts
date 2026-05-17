import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const bookingsStore = new Map<string, Record<string, unknown>>();
  return {
    requireAdmin: vi.fn(),
    requireAdminOrSupport: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    callAdminCallable: vi.fn(),
    captureServerException: vi.fn(),
    resetStore() {
      bookingsStore.clear();
      bookingsStore.set("bk_1", { bookingId: "bk_1", status: "requested" });
    },
    hasBooking(bookingId: string) {
      return bookingsStore.has(bookingId);
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName !== "bookings") {
            throw new Error(`Unexpected collection ${collectionName}`);
          }

          return {
            doc(id: string) {
              return {
                async get() {
                  return {
                    exists: bookingsStore.has(id),
                    id,
                    data: () => bookingsStore.get(id) || null,
                  };
                },
                async delete() {
                  bookingsStore.delete(id);
                },
              };
            },
          };
        },
      };
    },
  };
});

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
  getAdminDb: () => mocks.getAdminDb(),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

describe("DELETE /api/admin/bookings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetStore();
    mocks.requireAdmin.mockResolvedValue({ uid: "admin_1" });
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "admin_1", idToken: "token" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
    mocks.callAdminCallable.mockResolvedValue({ booking: { bookingId: "bk_1" } });
  });

  it("deletes an existing booking", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/bookings/bk_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "bk_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      ok: true,
      bookingId: "bk_1",
    });
    expect(mocks.hasBooking("bk_1")).toBe(false);
  });

  it("returns 400 when booking id is missing", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/bookings/%20", { method: "DELETE" }),
      { params: Promise.resolve({ id: " " }) }
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Booking id este obligatoriu.");
  });

  it("returns 404 when booking does not exist", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/bookings/bk_missing", { method: "DELETE" }),
      { params: Promise.resolve({ id: "bk_missing" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Programarea nu există.");
  });

  it("returns auth response when admin auth fails", async () => {
    const { DELETE } = await import("../route");
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));
    mocks.adminAuthErrorResponse.mockReturnValue(
      Response.json({ error: "Nu ai drepturi" }, { status: 403 })
    );

    const response = await DELETE(
      new Request("https://example.com/api/admin/bookings/bk_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "bk_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Nu ai drepturi");
  });
});

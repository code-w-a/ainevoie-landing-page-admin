import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const store = new Map<string, Record<string, unknown>>();
  return {
    requireAdmin: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    resetStore() {
      store.clear();
      store.set("pay_1", { paymentId: "pay_1", status: "paid" });
    },
    hasPayment(paymentId: string) {
      return store.has(paymentId);
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName !== "payments") {
            throw new Error(`Unexpected collection ${collectionName}`);
          }

          return {
            doc(id: string) {
              return {
                async get() {
                  return {
                    exists: store.has(id),
                    id,
                    data: () => store.get(id) || null,
                  };
                },
                async delete() {
                  store.delete(id);
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
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => mocks.getAdminDb(),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

describe("DELETE /api/admin/payments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetStore();
    mocks.requireAdmin.mockResolvedValue({ uid: "admin_1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("deletes an existing payment", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/payments/pay_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "pay_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      ok: true,
      paymentId: "pay_1",
    });
    expect(mocks.hasPayment("pay_1")).toBe(false);
  });

  it("returns 400 when payment id is missing", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/payments/%20", { method: "DELETE" }),
      { params: Promise.resolve({ id: " " }) }
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Payment id este obligatoriu.");
  });

  it("returns 404 when payment does not exist", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/payments/pay_missing", { method: "DELETE" }),
      { params: Promise.resolve({ id: "pay_missing" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Plata nu există.");
  });

  it("returns auth response when admin auth fails", async () => {
    const { DELETE } = await import("../route");
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));
    mocks.adminAuthErrorResponse.mockReturnValue(
      Response.json({ error: "Nu ai drepturi" }, { status: 403 })
    );

    const response = await DELETE(
      new Request("https://example.com/api/admin/payments/pay_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "pay_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Nu ai drepturi");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  store: new Map<string, Record<string, Record<string, unknown>>>(),
}));

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

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: (collectionName: string) => {
      const collectionData = mocks.store.get(collectionName) || {};
      const docs = Object.entries(collectionData).map(([id, data]) => ({
        id,
        data: () => data,
      }));

      return {
        doc: (id: string) => ({
          get: async () => ({
            id,
            exists: Boolean(collectionData[id]),
            data: () => collectionData[id],
          }),
        }),
        orderBy: () => ({
          limit: () => ({
            get: async () => ({ docs }),
          }),
        }),
        limit: () => ({
          get: async () => ({ docs }),
        }),
      };
    },
  }),
}));

describe("admin global search route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.store.clear();
    mocks.store.set("users", {
      user_1: {
        displayName: "Ana Popescu",
        email: "ana@example.com",
        phoneNumber: "+40700000001",
      },
    });
    mocks.store.set("providers", {
      provider_1: {
        email: "provider@example.com",
        status: "approved",
        professionalProfile: {
          displayName: "Ana Clean Team",
          businessName: "Ana Clean Team",
        },
      },
    });
    mocks.store.set("bookings", {
      bk_123: {
        bookingId: "bk_123",
        userId: "user_1",
        providerId: "provider_1",
        status: "requested",
        serviceSnapshot: { name: "Curățenie" },
      },
    });
    mocks.store.set("payments", {
      pay_123: {
        paymentId: "pay_123",
        bookingId: "bk_123",
        status: "failed",
        stripePaymentIntentId: "pi_123",
      },
    });
    mocks.store.set("supportTickets", {
      ticket_1: {
        subject: "Problemă plată bk_123",
        priority: "urgent",
        status: "open",
        relatedEntity: { bookingId: "bk_123", userId: "user_1", providerId: "provider_1" },
      },
    });
    mocks.store.set("conversations", {
      conv_bk_bk_123: {
        bookingId: "bk_123",
        status: "active",
        type: "booking",
        participantIds: ["user_1", "provider_1"],
      },
    });
  });

  it("returns grouped results across admin entities", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/search?q=bk_123"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.total).toBeGreaterThanOrEqual(4);
    expect(json.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "bookings",
          items: [expect.objectContaining({ href: "/admin/programari/bk_123" })],
        }),
        expect.objectContaining({
          type: "payments",
          items: [expect.objectContaining({ href: "/admin/programari/bk_123" })],
        }),
        expect.objectContaining({
          type: "support",
          items: [expect.objectContaining({ href: "/admin/suport?q=ticket_1" })],
        }),
        expect.objectContaining({
          type: "conversations",
          items: [expect.objectContaining({ href: "/admin/conversatii?conversationId=conv_bk_bk_123" })],
        }),
      ])
    );
  });

  it("matches people by email, phone and provider display name", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/search?q=ana"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "users",
          items: [expect.objectContaining({ href: "/admin/utilizatori/user_1" })],
        }),
        expect.objectContaining({
          type: "providers",
          items: [expect.objectContaining({ href: "/admin/prestatori/provider_1" })],
        }),
      ])
    );
  });

  it("returns empty results for short queries", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/search?q=a"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ query: "a", groups: [], total: 0 });
  });

  it("returns 403 when admin access is missing", async () => {
    const adminAuth = await import("@/lib/adminAuth");
    vi.mocked(adminAuth.requireAdminOrSupport).mockRejectedValueOnce(new Error("not_admin"));

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/search?q=bk_123"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Nu ai drepturi de administrator pentru acest cont.");
  });
});

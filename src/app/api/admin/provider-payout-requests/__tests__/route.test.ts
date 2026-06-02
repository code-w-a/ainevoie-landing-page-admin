import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, any>;

const mocks = vi.hoisted(() => {
  let payoutRequests: AnyRecord[] = [];
  let payments = new Map<string, AnyRecord>();
  let providers = new Map<string, AnyRecord>();

  const makeSnapshot = (rows: AnyRecord[], idField = "requestId") => ({
    docs: rows.map((row) => ({
      id: row[idField],
      exists: true,
      data: () => ({ ...row }),
    })),
  });

  const makeQuery = (
    source: AnyRecord[],
    filters: Array<{ field: string; value: unknown }> = []
  ) => ({
    where(field: string, _op: string, value: unknown) {
      return makeQuery(source, [...filters, { field, value }]);
    },
    orderBy() {
      return makeQuery(source, filters);
    },
    limit() {
      return makeQuery(source, filters);
    },
    async get() {
      const rows = source.filter((row) =>
        filters.every((filter) => String(row[filter.field] || "") === String(filter.value || ""))
      );
      return makeSnapshot(rows);
    },
  });

  return {
    requireAdmin: vi.fn(),
    requireAdminOrSupport: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    setFixtures(next: {
      payoutRequests: AnyRecord[];
      payments: Map<string, AnyRecord>;
      providers: Map<string, AnyRecord>;
    }) {
      payoutRequests = next.payoutRequests;
      payments = next.payments;
      providers = next.providers;
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName === "providerPayoutRequests") {
            return {
              where: (field: string, _op: string, value: unknown) =>
                makeQuery(payoutRequests, [{ field, value }]),
              orderBy: () => makeQuery(payoutRequests),
              doc: (id: string) => ({
                async get() {
                  const data = payoutRequests.find((item) => item.requestId === id);
                  return { exists: Boolean(data), id, data: () => data };
                },
                async set(payload: AnyRecord, options?: { merge?: boolean }) {
                  const index = payoutRequests.findIndex((item) => item.requestId === id);
                  const current = index >= 0 ? payoutRequests[index] : { requestId: id };
                  const next = options?.merge ? { ...current, ...payload } : payload;
                  if (index >= 0) {
                    payoutRequests[index] = next;
                  } else {
                    payoutRequests.push(next);
                  }
                },
              }),
            };
          }
          if (collectionName === "payments") {
            return {
              doc: (id: string) => ({
                id,
                async get() {
                  const data = payments.get(id);
                  return { exists: Boolean(data), id, data: () => data };
                },
                async set(payload: AnyRecord, options?: { merge?: boolean }) {
                  payments.set(id, options?.merge ? { ...(payments.get(id) || {}), ...payload } : payload);
                },
              }),
            };
          }
          return {
            doc: (id: string) => ({
              async get() {
                const data = providers.get(id);
                return { exists: Boolean(data), id, data: () => data };
              },
            }),
          };
        },
        async runTransaction<T>(updater: (transaction: AnyRecord) => Promise<T>) {
          const transaction = {
            get: (ref: AnyRecord) => ref.get(),
            set: (ref: AnyRecord, payload: AnyRecord, options?: { merge?: boolean }) => ref.set(payload, options),
          };
          return updater(transaction);
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

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => mocks.getAdminDb(),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

describe("admin provider payout request routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ uid: "admin-1" });
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "support-1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
    mocks.setFixtures({
      payoutRequests: [
        {
          requestId: "payout_1",
          providerId: "provider_1",
          status: "requested",
          currency: "RON",
          grossAmount: 200,
          platformFeeAmount: 40,
          providerNetAmount: 160,
          paymentIds: ["pay_1"],
          requestedAt: new Date("2026-05-08T10:00:00.000Z"),
        },
      ],
      payments: new Map([
        ["pay_1", { paymentId: "pay_1", providerPayoutStatus: "requested" }],
      ]),
      providers: new Map([
        ["provider_1", { email: "provider@example.com", professionalProfile: { displayName: "Provider One" } }],
      ]),
    });
  });

  it("lists payout requests with provider details", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/provider-payout-requests?status=requested"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(expect.objectContaining({
      requestId: "payout_1",
      providerNetAmount: 160,
      status: "requested",
    }));
    expect(json.items[0].provider.displayName).toBe("Provider One");
  });

  it("marks a payout request paid and updates linked payments", async () => {
    const { POST } = await import("../[id]/mark-paid/route");
    const response = await POST(
      new Request("https://example.com/api/admin/provider-payout-requests/payout_1/mark-paid", {
        method: "POST",
        body: JSON.stringify({ adminNote: "paid by bank" }),
      }),
      { params: Promise.resolve({ id: "payout_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.status).toBe("paid");
  });
});

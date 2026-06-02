import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, any>;

const mocks = vi.hoisted(() => {
  let now = Date.now();
  let payments: AnyRecord[] = [];
  let bookings = new Map<string, AnyRecord>();
  let users = new Map<string, AnyRecord>();
  let providers = new Map<string, AnyRecord>();

  const toMs = (value: unknown) => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof (value as { toMillis?: () => number })?.toMillis === "function") {
      return Number((value as { toMillis: () => number }).toMillis()) || 0;
    }
    if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
      return (value as { toDate: () => Date }).toDate().getTime();
    }
    const parsed = new Date(String(value)).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const makeQuery = (
    source: AnyRecord[],
    filters: Array<{ field: string; op: string; value: unknown }> = [],
    limitCount = Number.POSITIVE_INFINITY
  ) => ({
    where(field: string, op: string, value: unknown) {
      return makeQuery(source, [...filters, { field, op, value }], limitCount);
    },
    orderBy() {
      return makeQuery(source, filters, limitCount);
    },
    limit(value: number) {
      return makeQuery(source, filters, value);
    },
    async get() {
      let rows = [...source];
      filters.forEach((filter) => {
        rows = rows.filter((row) => {
          const left = row[filter.field];
          if (filter.op === "==") {
            return String(left || "") === String(filter.value || "");
          }
          if (filter.op === ">=") {
            return toMs(left) >= toMs(filter.value);
          }
          if (filter.op === "<=") {
            return toMs(left) <= toMs(filter.value);
          }
          return true;
        });
      });
      rows.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      const limited = rows.slice(0, Number.isFinite(limitCount) ? limitCount : rows.length);
      return {
        docs: limited.map((row) => ({
          id: row.paymentId,
          data: () => ({ ...row }),
        })),
      };
    },
  });

  const getDoc = (collectionName: string, id: string) => {
    if (collectionName === "bookings") {
      const data = bookings.get(id);
      return {
        exists: Boolean(data),
        id,
        data: () => data,
      };
    }
    if (collectionName === "users") {
      const data = users.get(id);
      return {
        exists: Boolean(data),
        id,
        data: () => data,
      };
    }
    const data = providers.get(id);
    return {
      exists: Boolean(data),
      id,
      data: () => data,
    };
  };

  return {
    requireAdminOrSupport: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    setNow(value: number) {
      now = value;
    },
    getNow() {
      return now;
    },
    setFixtures(next: {
      payments: AnyRecord[];
      bookings: Map<string, AnyRecord>;
      users: Map<string, AnyRecord>;
      providers: Map<string, AnyRecord>;
    }) {
      payments = next.payments;
      bookings = next.bookings;
      users = next.users;
      providers = next.providers;
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName === "payments") {
            return {
              where: (field: string, op: string, value: unknown) =>
                makeQuery(payments, [{ field, op, value }]),
              orderBy: () => makeQuery(payments),
              limit: (value: number) => makeQuery(payments, [], value),
              doc: (id: string) => ({
                get: async () => ({
                  exists: payments.some((item) => item.paymentId === id),
                  id,
                  data: () => payments.find((item) => item.paymentId === id) || null,
                }),
              }),
            };
          }
          return {
            doc: (id: string) => ({
              get: async () => getDoc(collectionName, id),
            }),
          };
        },
      };
    },
  };
});

vi.mock("@/lib/adminAuth", () => ({
  requireAdminOrSupport: mocks.requireAdminOrSupport,
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => mocks.getAdminDb(),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

function buildFixtures() {
  const now = new Date("2026-05-08T12:00:00.000Z").getTime();
  mocks.setNow(now);
  vi.setSystemTime(new Date(now));

  const payments = [
    {
      paymentId: "pay_missing",
      bookingId: "bk_1",
      userId: "user_1",
      providerId: "provider_1",
      status: "in_progress",
      amount: 120,
      grossAmount: 120,
      platformFeePercent: 20,
      platformFeeAmount: 24,
      providerNetAmount: 96,
      providerPayoutStatus: "not_available",
      currency: "RON",
      processor: "stripe",
      transactionId: "tx_1",
      stripePaymentIntentId: "pi_missing",
      stripeLatestChargeId: "ch_missing",
      webhookEventId: "",
      createdAt: new Date(now - 25 * 60 * 60 * 1000),
      updatedAt: new Date(now - 25 * 60 * 60 * 1000),
    },
    {
      paymentId: "pay_delayed",
      bookingId: "bk_2",
      userId: "user_2",
      providerId: "provider_2",
      status: "in_progress",
      amount: 150,
      grossAmount: 150,
      platformFeePercent: 20,
      platformFeeAmount: 30,
      providerNetAmount: 120,
      providerPayoutStatus: "not_available",
      currency: "RON",
      processor: "stripe",
      transactionId: "tx_2",
      stripePaymentIntentId: "pi_delayed",
      stripeLatestChargeId: "ch_delayed",
      webhookEventId: "",
      createdAt: new Date(now - 20 * 60 * 1000),
      updatedAt: new Date(now - 20 * 60 * 1000),
    },
    {
      paymentId: "pay_ok",
      bookingId: "bk_3",
      userId: "user_3",
      providerId: "provider_3",
      status: "paid",
      amount: 200,
      grossAmount: 200,
      platformFeePercent: 20,
      platformFeeAmount: 40,
      providerNetAmount: 160,
      providerPayoutStatus: "available",
      currency: "RON",
      processor: "stripe",
      transactionId: "tx_3",
      stripePaymentIntentId: "pi_ok",
      stripeLatestChargeId: "ch_ok",
      webhookEventId: "evt_123",
      createdAt: new Date(now - 5 * 60 * 1000),
      updatedAt: new Date(now - 5 * 60 * 1000),
    },
  ];

  const bookings = new Map<string, AnyRecord>([
    ["bk_1", { status: "requested", userSnapshot: { displayName: "Ana" }, providerSnapshot: { displayName: "P1" }, serviceSnapshot: { name: "Curatenie" } }],
    ["bk_2", { status: "confirmed", userSnapshot: { displayName: "Mihai" }, providerSnapshot: { displayName: "P2" }, serviceSnapshot: { name: "Instalatii" } }],
    ["bk_3", { status: "completed", userSnapshot: { displayName: "Ioana" }, providerSnapshot: { displayName: "P3" }, serviceSnapshot: { name: "Mutari" } }],
  ]);

  const users = new Map<string, AnyRecord>([
    ["user_1", { displayName: "Ana", email: "ana@example.com" }],
    ["user_2", { displayName: "Mihai", email: "mihai@example.com" }],
    ["user_3", { displayName: "Ioana", email: "ioana@example.com" }],
  ]);

  const providers = new Map<string, AnyRecord>([
    ["provider_1", { email: "p1@example.com", professionalProfile: { displayName: "Provider One" } }],
    ["provider_2", { email: "p2@example.com", professionalProfile: { displayName: "Provider Two" } }],
    ["provider_3", { email: "p3@example.com", professionalProfile: { displayName: "Provider Three" } }],
  ]);

  mocks.setFixtures({ payments, bookings, users, providers });
}

describe("admin payments routes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    buildFixtures();
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "admin-1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("returns payment list with webhook reconciliation states", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/payments?page=1&pageSize=20")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(3);
    expect(json.items.find((item: AnyRecord) => item.paymentId === "pay_missing")?.webhookState).toBe("missing");
    expect(json.items.find((item: AnyRecord) => item.paymentId === "pay_delayed")?.webhookState).toBe("delayed");
    expect(json.items.find((item: AnyRecord) => item.paymentId === "pay_ok")?.webhookState).toBe("ok");
    expect(json.items.find((item: AnyRecord) => item.paymentId === "pay_ok")).toEqual(expect.objectContaining({
      grossAmount: 200,
      platformFeeAmount: 40,
      providerNetAmount: 160,
      providerPayoutStatus: "available",
    }));
  });

  it("applies status/date/provider/user/processorId and q filters", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request(
        "https://example.com/api/admin/payments?page=1&pageSize=20&status=in_progress&providerId=provider_2&userId=user_2&processorId=pi_delayed&q=Mihai&dateFrom=2026-05-08&dateTo=2026-05-08"
      )
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].paymentId).toBe("pay_delayed");
  });

  it("filters by provider payout status", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/payments?page=1&pageSize=20&providerPayoutStatus=available")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].paymentId).toBe("pay_ok");
  });

  it("returns auth response when account is not authorized", async () => {
    mocks.requireAdminOrSupport.mockRejectedValueOnce(new Error("not_admin"));
    mocks.adminAuthErrorResponse.mockReturnValueOnce(
      Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/payments"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toContain("administrator");
  });

  it("exports CSV with correct content type and rows", async () => {
    const { GET } = await import("../export/route");
    const response = await GET(
      new Request("https://example.com/api/admin/payments/export?status=paid")
    );
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(csv).toContain("paymentId,status,createdAt");
    expect(csv).toContain("providerPayoutStatus");
    expect(csv).toContain("pay_ok");
    expect(csv).not.toContain("pay_missing");
  });

  it("returns 400 when export exceeds 5000 rows", async () => {
    const manyPayments = Array.from({ length: 5001 }, (_, index) => ({
      paymentId: `pay_${index}`,
      bookingId: "bk_1",
      userId: "user_1",
      providerId: "provider_1",
      status: "paid",
      amount: 100,
      currency: "RON",
      processor: "stripe",
      transactionId: `tx_${index}`,
      stripePaymentIntentId: `pi_${index}`,
      stripeLatestChargeId: `ch_${index}`,
      webhookEventId: `evt_${index}`,
      createdAt: new Date("2026-05-08T10:00:00.000Z"),
      updatedAt: new Date("2026-05-08T10:00:00.000Z"),
    }));

    mocks.setFixtures({
      payments: manyPayments,
      bookings: new Map([["bk_1", { status: "confirmed", userSnapshot: { displayName: "Ana" }, providerSnapshot: { displayName: "P1" }, serviceSnapshot: { name: "Curatenie" } }]]),
      users: new Map([["user_1", { displayName: "Ana", email: "ana@example.com" }]]),
      providers: new Map([["provider_1", { email: "p1@example.com", professionalProfile: { displayName: "Provider One" } }]]),
    });

    const { GET } = await import("../export/route");
    const response = await GET(new Request("https://example.com/api/admin/payments/export"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("5000");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, any>;

const mocks = vi.hoisted(() => {
  let reviews: AnyRecord[] = [];
  let bookings = new Map<string, AnyRecord>();
  let users = new Map<string, AnyRecord>();
  let providers = new Map<string, AnyRecord>();
  const auditWrites: AnyRecord[] = [];
  let autoAuditId = 0;

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
          id: row.reviewId,
          data: () => ({ ...row }),
        })),
      };
    },
  });

  const getDocFrom = (collectionName: string, id: string) => {
    if (collectionName === "reviews") {
      const row = reviews.find((item) => item.reviewId === id) || null;
      return {
        exists: Boolean(row),
        id,
        data: () => row,
      };
    }
    if (collectionName === "bookings") {
      const row = bookings.get(id);
      return {
        exists: Boolean(row),
        id,
        data: () => row,
      };
    }
    if (collectionName === "users") {
      const row = users.get(id);
      return {
        exists: Boolean(row),
        id,
        data: () => row,
      };
    }
    const row = providers.get(id);
    return {
      exists: Boolean(row),
      id,
      data: () => row,
    };
  };

  return {
    requireAdminOrSupport: vi.fn(),
    requireAdmin: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    setFixtures(next: {
      reviews: AnyRecord[];
      bookings: Map<string, AnyRecord>;
      users: Map<string, AnyRecord>;
      providers: Map<string, AnyRecord>;
    }) {
      reviews = next.reviews;
      bookings = next.bookings;
      users = next.users;
      providers = next.providers;
      auditWrites.length = 0;
      autoAuditId = 0;
    },
    getAuditWrites() {
      return [...auditWrites];
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName === "reviews") {
            return {
              where: (field: string, op: string, value: unknown) =>
                makeQuery(reviews, [{ field, op, value }]),
              orderBy: () => makeQuery(reviews),
              limit: (value: number) => makeQuery(reviews, [], value),
              doc: (id: string) => ({
                get: async () => getDocFrom(collectionName, id),
                set: async (payload: AnyRecord, options?: { merge?: boolean }) => {
                  const index = reviews.findIndex((item) => item.reviewId === id);
                  if (index < 0) return;
                  if (options?.merge) {
                    reviews[index] = {
                      ...reviews[index],
                      ...payload,
                      adminModeration: {
                        ...(reviews[index].adminModeration || {}),
                        ...(payload.adminModeration || {}),
                      },
                    };
                    return;
                  }
                  reviews[index] = { ...payload };
                },
              }),
            };
          }
          if (collectionName === "auditEvents") {
            return {
              doc: (id?: string) => {
                const nextId = id || `evt_${++autoAuditId}`;
                return {
                  id: nextId,
                  set: async (payload: AnyRecord) => {
                    auditWrites.push({ id: nextId, ...payload });
                  },
                };
              },
            };
          }
          return {
            doc: (id: string) => ({
              get: async () => getDocFrom(collectionName, id),
            }),
          };
        },
      };
    },
  };
});

vi.mock("@/lib/adminAuth", () => ({
  requireAdminOrSupport: mocks.requireAdminOrSupport,
  requireAdmin: mocks.requireAdmin,
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => mocks.getAdminDb(),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

function buildFixtures() {
  const reviews = [
    {
      reviewId: "bk_1",
      bookingId: "bk_1",
      providerId: "provider_1",
      authorUserId: "user_1",
      status: "published",
      rating: 5,
      review: "Foarte bun serviciu",
      createdAt: new Date("2026-05-08T09:00:00.000Z"),
      updatedAt: new Date("2026-05-08T09:00:00.000Z"),
      authorSnapshot: { displayName: "Ana" },
      providerSnapshot: { displayName: "Provider One" },
      serviceSnapshot: { serviceName: "Curatenie" },
    },
    {
      reviewId: "bk_2",
      bookingId: "bk_2",
      providerId: "provider_2",
      authorUserId: "user_2",
      status: "hidden_by_admin",
      rating: 2,
      review: "Intarziere mare",
      createdAt: new Date("2026-05-07T10:00:00.000Z"),
      updatedAt: new Date("2026-05-07T10:00:00.000Z"),
      authorSnapshot: { displayName: "Mihai" },
      providerSnapshot: { displayName: "Provider Two" },
      serviceSnapshot: { serviceName: "Instalatii" },
      adminModeration: {
        note: "Limbaj nepotrivit",
      },
    },
  ];

  const bookings = new Map<string, AnyRecord>([
    ["bk_1", { status: "completed", scheduledStartAt: new Date("2026-05-07T08:00:00.000Z") }],
    ["bk_2", { status: "completed", scheduledStartAt: new Date("2026-05-06T08:00:00.000Z") }],
  ]);

  const users = new Map<string, AnyRecord>([
    ["user_1", { displayName: "Ana", email: "ana@example.com" }],
    ["user_2", { displayName: "Mihai", email: "mihai@example.com" }],
  ]);

  const providers = new Map<string, AnyRecord>([
    ["provider_1", { email: "p1@example.com", professionalProfile: { displayName: "Provider One" } }],
    ["provider_2", { email: "p2@example.com", professionalProfile: { displayName: "Provider Two" } }],
  ]);

  mocks.setFixtures({ reviews, bookings, users, providers });
}

describe("admin reviews routes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T12:00:00.000Z"));
    vi.clearAllMocks();
    buildFixtures();
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "support-1" });
    mocks.requireAdmin.mockResolvedValue({ uid: "admin-1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("lists and filters reviews", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request(
        "https://example.com/api/admin/reviews?page=1&pageSize=20&status=published&providerId=provider_1&userId=user_1&ratingMin=4&ratingMax=5&dateFrom=2026-05-08&dateTo=2026-05-08&q=Foarte"
      )
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].reviewId).toBe("bk_1");
  });

  it("exports CSV and respects filtering", async () => {
    const { GET } = await import("../export/route");
    const response = await GET(
      new Request("https://example.com/api/admin/reviews/export?status=hidden_by_admin")
    );
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(csv).toContain("reviewId,bookingId,status,rating");
    expect(csv).toContain("bk_2");
    expect(csv).not.toContain("bk_1");
  });

  it("returns 403 for support on moderation", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("not_admin"));
    mocks.adminAuthErrorResponse.mockReturnValueOnce(
      Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
    );

    const { PATCH } = await import("../[id]/moderation/route");
    const response = await PATCH(
      new Request("https://example.com/api/admin/reviews/bk_1/moderation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "hidden_by_admin" }),
      }),
      { params: Promise.resolve({ id: "bk_1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("moderates review and writes audit event", async () => {
    const { PATCH } = await import("../[id]/moderation/route");
    const response = await PATCH(
      new Request("https://example.com/api/admin/reviews/bk_1/moderation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "hidden_by_admin",
          note: "Conținut neadecvat",
        }),
      }),
      { params: Promise.resolve({ id: "bk_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.status).toBe("hidden_by_admin");
    expect(json.item.adminModeration.note).toBe("Conținut neadecvat");

    const auditWrites = mocks.getAuditWrites();
    expect(auditWrites).toHaveLength(1);
    expect(auditWrites[0].action).toBe("review.moderate");
    expect(auditWrites[0].statusFrom).toBe("published");
    expect(auditWrites[0].statusTo).toBe("hidden_by_admin");
  });

  it("returns 404 when moderating a missing review", async () => {
    const { PATCH } = await import("../[id]/moderation/route");
    const response = await PATCH(
      new Request("https://example.com/api/admin/reviews/unknown/moderation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      }),
      { params: Promise.resolve({ id: "unknown" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toContain("nu există");
  });
});

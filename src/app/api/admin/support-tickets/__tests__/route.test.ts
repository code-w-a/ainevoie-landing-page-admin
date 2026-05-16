import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, any>;

const mocks = vi.hoisted(() => {
  let tickets: AnyRecord[] = [];
  let users = new Map<string, AnyRecord>();
  let providers = new Map<string, AnyRecord>();
  let bookings = new Map<string, AnyRecord>();
  let admins = new Map<string, AnyRecord>();

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
          id: row.ticketId,
          data: () => ({ ...row }),
        })),
      };
    },
  });

  const getFromMap = (collectionName: string, id: string) => {
    const source =
      collectionName === "users"
        ? users
        : collectionName === "providers"
          ? providers
          : collectionName === "bookings"
            ? bookings
            : admins;
    const value = source.get(id);
    return {
      exists: Boolean(value),
      id,
      data: () => value,
    };
  };

  return {
    requireAdminOrSupport: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    setFixtures(next: {
      tickets: AnyRecord[];
      users: Map<string, AnyRecord>;
      providers: Map<string, AnyRecord>;
      bookings: Map<string, AnyRecord>;
      admins: Map<string, AnyRecord>;
    }) {
      tickets = next.tickets;
      users = next.users;
      providers = next.providers;
      bookings = next.bookings;
      admins = next.admins;
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName === "supportTickets") {
            return {
              where: (field: string, op: string, value: unknown) =>
                makeQuery(tickets, [{ field, op, value }]),
              orderBy: () => makeQuery(tickets),
              limit: (value: number) => makeQuery(tickets, [], value),
              doc: (id: string) => ({
                get: async () => {
                  const row = tickets.find((item) => item.ticketId === id) || null;
                  return {
                    exists: Boolean(row),
                    id,
                    data: () => row,
                  };
                },
                set: async (payload: AnyRecord, options?: { merge?: boolean }) => {
                  const index = tickets.findIndex((item) => item.ticketId === id);
                  if (index < 0) {
                    return;
                  }
                  if (options?.merge) {
                    tickets[index] = {
                      ...tickets[index],
                      ...payload,
                      relatedEntity:
                        payload.relatedEntity !== undefined
                          ? payload.relatedEntity
                          : tickets[index].relatedEntity,
                      updatedBy: {
                        ...(tickets[index].updatedBy || {}),
                        ...(payload.updatedBy || {}),
                      },
                    };
                    return;
                  }
                  tickets[index] = { ...payload };
                },
              }),
            };
          }

          return {
            doc: (id: string) => ({
              get: async () => getFromMap(collectionName, id),
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
  const tickets = [
    {
      ticketId: "ticket_1",
      topic: "support",
      subject: "Need help",
      initialMessage: "Account question",
      status: "open",
      priority: "normal",
      requesterUid: "user_1",
      requesterRole: "user",
      requesterSnapshot: { displayName: "Ana", email: "ana@example.com", phoneNumber: null },
      assignedAdminUid: "admin_1",
      assignedAdminSnapshot: { displayName: "Admin One", email: "admin1@example.com", role: "admin" },
      adminNote: "Follow up",
      relatedEntity: { bookingId: "bk_1", providerId: "provider_1", userId: "user_1" },
      createdAt: new Date("2026-05-08T08:00:00.000Z"),
      updatedAt: new Date("2026-05-08T08:30:00.000Z"),
      resolvedAt: null,
      closedAt: null,
      updatedBy: { uid: "admin_1", role: "admin" },
      schemaVersion: 1,
    },
    {
      ticketId: "ticket_2",
      topic: "bug",
      subject: "Payment bug",
      initialMessage: "Stripe issue",
      status: "closed",
      priority: "high",
      requesterUid: "provider_1",
      requesterRole: "provider",
      requesterSnapshot: { displayName: "Provider One", email: "provider@example.com", phoneNumber: null },
      assignedAdminUid: "admin_2",
      assignedAdminSnapshot: { displayName: "Support One", email: "support1@example.com", role: "support" },
      adminNote: "Solved",
      relatedEntity: { bookingId: "bk_2", providerId: "provider_1", userId: null },
      createdAt: new Date("2026-05-07T09:00:00.000Z"),
      updatedAt: new Date("2026-05-07T10:00:00.000Z"),
      resolvedAt: new Date("2026-05-07T09:30:00.000Z"),
      closedAt: new Date("2026-05-07T10:00:00.000Z"),
      updatedBy: { uid: "admin_2", role: "support" },
      schemaVersion: 1,
    },
  ];

  const users = new Map<string, AnyRecord>([
    ["user_1", { displayName: "Ana", email: "ana@example.com" }],
  ]);

  const providers = new Map<string, AnyRecord>([
    ["provider_1", { email: "provider@example.com", professionalProfile: { displayName: "Provider One" } }],
  ]);

  const bookings = new Map<string, AnyRecord>([
    ["bk_1", { status: "requested", scheduledStartAt: new Date("2026-05-10T08:00:00.000Z") }],
    ["bk_2", { status: "completed", scheduledStartAt: new Date("2026-05-05T08:00:00.000Z") }],
  ]);

  const admins = new Map<string, AnyRecord>([
    ["admin_1", { displayName: "Admin One", email: "admin1@example.com", role: "admin" }],
    ["admin_2", { displayName: "Support One", email: "support1@example.com", role: "support" }],
  ]);

  mocks.setFixtures({ tickets, users, providers, bookings, admins });
}

describe("admin support tickets routes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T12:00:00.000Z"));
    vi.clearAllMocks();
    buildFixtures();
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "support_1", adminAccessLevel: "support" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("lists and filters support tickets", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request(
        "https://example.com/api/admin/support-tickets?page=1&pageSize=20&status=open&priority=normal&topic=support&assignedAdminUid=admin_1&requesterUid=user_1&relatedEntityType=booking&relatedEntityId=bk_1&dateFrom=2026-05-08&dateTo=2026-05-08&q=account"
      )
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].ticketId).toBe("ticket_1");
  });

  it("returns auth response when account is not authorized", async () => {
    mocks.requireAdminOrSupport.mockRejectedValueOnce(new Error("not_admin"));
    mocks.adminAuthErrorResponse.mockReturnValueOnce(
      Response.json(
        { error: "Nu ai drepturi de administrator pentru acest cont." },
        { status: 403 }
      )
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/support-tickets"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toContain("administrator");
  });

  it("patches support ticket status, priority, assignment and note", async () => {
    const { PATCH } = await import("../[id]/route");
    const response = await PATCH(
      new Request("https://example.com/api/admin/support-tickets/ticket_1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "closed",
          priority: "urgent",
          assignedAdminUid: "admin_2",
          adminNote: "Escalated",
          relatedEntity: {
            bookingId: "bk_2",
            providerId: "provider_1",
            userId: null,
          },
        }),
      }),
      { params: Promise.resolve({ id: "ticket_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.status).toBe("closed");
    expect(json.item.priority).toBe("urgent");
    expect(json.item.assignedAdminUid).toBe("admin_2");
    expect(json.item.adminNote).toBe("Escalated");
    expect(json.item.relatedEntity.bookingId).toBe("bk_2");
    expect(json.item.closedAt).toBeTruthy();
    expect(json.item.resolvedAt).toBeTruthy();
  });

  it("returns 404 when patching a missing ticket", async () => {
    const { PATCH } = await import("../[id]/route");
    const response = await PATCH(
      new Request("https://example.com/api/admin/support-tickets/missing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "missing" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toContain("nu există");
  });
});

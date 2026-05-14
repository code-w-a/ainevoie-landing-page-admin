import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, any>;

const mocks = vi.hoisted(() => {
  let conversations: AnyRecord[] = [];
  let memberships = new Map<string, AnyRecord>();
  let messagesByConversation = new Map<string, AnyRecord[]>();
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

  const makeConversationQuery = (
    filters: Array<{ field: string; value: unknown }> = [],
    startAfterMs: number | null = null,
    limitCount = Number.POSITIVE_INFINITY
  ) => ({
    where(field: string, _op: string, value: unknown) {
      return makeConversationQuery([...filters, { field, value }], startAfterMs, limitCount);
    },
    orderBy() {
      return makeConversationQuery(filters, startAfterMs, limitCount);
    },
    startAfter(value: unknown) {
      return makeConversationQuery(filters, toMs(value), limitCount);
    },
    limit(value: number) {
      return makeConversationQuery(filters, startAfterMs, value);
    },
    async get() {
      let rows = [...conversations];
      filters.forEach((filter) => {
        rows = rows.filter((row) => String(row[filter.field] || "") === String(filter.value || ""));
      });
      rows.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
      if (startAfterMs != null) {
        rows = rows.filter((row) => toMs(row.updatedAt) < startAfterMs);
      }
      const limited = rows.slice(0, Number.isFinite(limitCount) ? limitCount : rows.length);
      return {
        docs: limited.map((row) => ({
          id: row.conversationId,
          data: () => ({ ...row }),
          get: (field: string) => row[field],
        })),
      };
    },
  });

  const makeMessagesQuery = (
    conversationId: string,
    startAfterMs: number | null = null,
    limitCount = Number.POSITIVE_INFINITY
  ) => ({
    orderBy() {
      return makeMessagesQuery(conversationId, startAfterMs, limitCount);
    },
    startAfter(value: unknown) {
      return makeMessagesQuery(conversationId, toMs(value), limitCount);
    },
    limit(value: number) {
      return makeMessagesQuery(conversationId, startAfterMs, value);
    },
    async get() {
      let rows = [...(messagesByConversation.get(conversationId) || [])];
      rows.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      if (startAfterMs != null) {
        rows = rows.filter((row) => toMs(row.createdAt) < startAfterMs);
      }
      const limited = rows.slice(0, Number.isFinite(limitCount) ? limitCount : rows.length);
      return {
        docs: limited.map((row) => ({
          id: row.messageId,
          data: () => ({ ...row }),
          get: (field: string) => row[field],
        })),
      };
    },
  });

  return {
    requireAdminOrSupport: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    setFixtures(next: {
      conversations: AnyRecord[];
      memberships: Map<string, AnyRecord>;
      messagesByConversation: Map<string, AnyRecord[]>;
    }) {
      conversations = next.conversations;
      memberships = next.memberships;
      messagesByConversation = next.messagesByConversation;
      auditWrites.length = 0;
      autoAuditId = 0;
    },
    getAuditWrites() {
      return [...auditWrites];
    },
    getMembership(id: string) {
      return memberships.get(id) || null;
    },
    getAdminDb() {
      return {
        collection(collectionName: string) {
          if (collectionName === "conversations") {
            return {
              where: (field: string, _op: string, value: unknown) =>
                makeConversationQuery([{ field, value }]),
              orderBy: () => makeConversationQuery(),
              limit: (value: number) => makeConversationQuery([], null, value),
              doc: (id: string) => ({
                get: async () => {
                  const row = conversations.find((item) => item.conversationId === id) || null;
                  return {
                    exists: Boolean(row),
                    id,
                    data: () => row,
                  };
                },
                set: async (payload: AnyRecord, options?: { merge?: boolean }) => {
                  const index = conversations.findIndex((item) => item.conversationId === id);
                  if (index < 0) return;
                  if (options?.merge) {
                    conversations[index] = {
                      ...conversations[index],
                      ...payload,
                      adminModeration: {
                        ...(conversations[index].adminModeration || {}),
                        ...(payload.adminModeration || {}),
                      },
                    };
                    return;
                  }
                  conversations[index] = { ...payload };
                },
                collection: (subName: string) => {
                  if (subName !== "messages") {
                    throw new Error("Unsupported subcollection");
                  }
                  return {
                    orderBy: () => makeMessagesQuery(id),
                  };
                },
              }),
            };
          }

          if (collectionName === "conversationMemberships") {
            return {
              where(field: string, _op: string, value: unknown) {
                return {
                  limit() {
                    return {
                      async get() {
                        const docs = [...memberships.entries()]
                          .filter(([, row]) => String(row[field] || "") === String(value || ""))
                          .map(([id, row]) => ({
                            id,
                            data: () => ({ ...row }),
                          }));
                        return { docs };
                      },
                    };
                  },
                };
              },
              doc: (id: string) => ({
                get: async () => {
                  const row = memberships.get(id) || null;
                  return {
                    exists: Boolean(row),
                    id,
                    data: () => row,
                  };
                },
                set: async (payload: AnyRecord, options?: { merge?: boolean }) => {
                  const current = memberships.get(id) || null;
                  if (!current) return;
                  memberships.set(
                    id,
                    options?.merge
                      ? {
                        ...current,
                        ...payload,
                        blockedBy:
                          payload.blockedBy !== undefined ? payload.blockedBy : current.blockedBy,
                      }
                      : payload
                  );
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

          throw new Error(`Unexpected collection ${collectionName}`);
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
  const conversations = [
    {
      conversationId: "conv_bk_bk_1",
      type: "booking",
      status: "active",
      bookingId: "bk_1",
      userId: "user_1",
      providerId: "provider_1",
      participantIds: ["user_1", "provider_1"],
      participantRoles: { user_1: "user", provider_1: "provider" },
      lastMessage: {
        messageId: "msg_2",
        preview: "Salut",
        createdAt: new Date("2026-05-08T09:00:00.000Z"),
      },
      adminModeration: {
        status: "none",
        note: null,
      },
      createdAt: new Date("2026-05-08T08:00:00.000Z"),
      updatedAt: new Date("2026-05-08T09:00:00.000Z"),
    },
    {
      conversationId: "conv_direct_user_2_provider_2",
      type: "direct",
      status: "closed",
      bookingId: null,
      userId: "user_2",
      providerId: "provider_2",
      participantIds: ["user_2", "provider_2"],
      participantRoles: { user_2: "user", provider_2: "provider" },
      lastMessage: {
        messageId: "msg_5",
        preview: "Disputa",
        createdAt: new Date("2026-05-07T07:00:00.000Z"),
      },
      adminModeration: {
        status: "flagged",
        note: "Investigate",
      },
      createdAt: new Date("2026-05-07T06:00:00.000Z"),
      updatedAt: new Date("2026-05-07T07:00:00.000Z"),
    },
  ];

  const memberships = new Map<string, AnyRecord>([
    [
      "conv_bk_bk_1_user_1",
      {
        membershipId: "conv_bk_bk_1_user_1",
        conversationId: "conv_bk_bk_1",
        uid: "user_1",
        role: "user",
        unreadCount: 1,
        blockedAt: null,
        lastMessageAt: new Date("2026-05-08T09:00:00.000Z"),
      },
    ],
    [
      "conv_bk_bk_1_provider_1",
      {
        membershipId: "conv_bk_bk_1_provider_1",
        conversationId: "conv_bk_bk_1",
        uid: "provider_1",
        role: "provider",
        unreadCount: 0,
        blockedAt: null,
        lastMessageAt: new Date("2026-05-08T09:00:00.000Z"),
      },
    ],
  ]);

  const messagesByConversation = new Map<string, AnyRecord[]>([
    [
      "conv_bk_bk_1",
      [
        {
          messageId: "msg_2",
          conversationId: "conv_bk_bk_1",
          senderUid: "provider_1",
          senderRole: "provider",
          type: "text",
          body: "Salut",
          status: "sent",
          createdAt: new Date("2026-05-08T09:00:00.000Z"),
          updatedAt: new Date("2026-05-08T09:00:00.000Z"),
        },
        {
          messageId: "msg_1",
          conversationId: "conv_bk_bk_1",
          senderUid: "user_1",
          senderRole: "user",
          type: "text",
          body: "Buna",
          status: "sent",
          createdAt: new Date("2026-05-08T08:55:00.000Z"),
          updatedAt: new Date("2026-05-08T08:55:00.000Z"),
        },
      ],
    ],
  ]);

  mocks.setFixtures({ conversations, memberships, messagesByConversation });
}

describe("admin conversations routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildFixtures();
    mocks.requireAdminOrSupport.mockResolvedValue({ uid: "support_1", adminAccessLevel: "support" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("lists conversations with filters", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/conversations?userId=user_1&q=bk_1&limit=20")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].conversationId).toBe("conv_bk_bk_1");
    expect(json.items[0].body).toBeUndefined();
  });

  it("loads conversation detail and read-only messages", async () => {
    const detailRoute = await import("../[id]/route");
    const messagesRoute = await import("../[id]/messages/route");

    const detailResponse = await detailRoute.GET(
      new Request("https://example.com/api/admin/conversations/conv_bk_bk_1"),
      { params: Promise.resolve({ id: "conv_bk_bk_1" }) }
    );
    const detailJson = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailJson.item.conversationId).toBe("conv_bk_bk_1");
    expect(detailJson.participants).toHaveLength(2);

    const messagesResponse = await messagesRoute.GET(
      new Request("https://example.com/api/admin/conversations/conv_bk_bk_1/messages?limit=1"),
      { params: Promise.resolve({ id: "conv_bk_bk_1" }) }
    );
    const messagesJson = await messagesResponse.json();

    expect(messagesResponse.status).toBe(200);
    expect(messagesJson.items).toHaveLength(1);
    expect(messagesJson.items[0].messageId).toBe("msg_2");
    expect(messagesJson.page.hasMore).toBe(true);
  });

  it("patches moderation and writes audit event", async () => {
    const { PATCH } = await import("../[id]/moderation/route");

    const response = await PATCH(
      new Request("https://example.com/api/admin/conversations/conv_bk_bk_1/moderation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "flagged", note: "Escalated" }),
      }),
      { params: Promise.resolve({ id: "conv_bk_bk_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.moderationStatus).toBe("flagged");

    const writes = mocks.getAuditWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0].action).toBe("conversation.flag");
  });

  it("blocks participant and writes audit event", async () => {
    const { PATCH } = await import("../[id]/participants/[uid]/block/route");

    const response = await PATCH(
      new Request("https://example.com/api/admin/conversations/conv_bk_bk_1/participants/user_1/block", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blocked: true, reason: "Abusive language" }),
      }),
      { params: Promise.resolve({ id: "conv_bk_bk_1", uid: "user_1" }) }
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Boolean(json.participant.blockedAt)).toBe(true);

    const membership = mocks.getMembership("conv_bk_bk_1_user_1");
    expect(Boolean(membership?.blockedAt)).toBe(true);

    const writes = mocks.getAuditWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0].action).toBe("conversation.participant.block");
  });

  it("returns auth error response when account is not authorized", async () => {
    mocks.requireAdminOrSupport.mockRejectedValueOnce(new Error("not_admin"));
    mocks.adminAuthErrorResponse.mockReturnValueOnce(
      Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("https://example.com/api/admin/conversations"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toContain("administrator");
  });
});

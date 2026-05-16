import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export type ConversationModerationStatus = "none" | "flagged" | "under_review" | "resolved";

export type ConversationModerationPayload = {
  status?: ConversationModerationStatus;
  note?: string;
};

export type ConversationParticipantBlockPayload = {
  blocked: boolean;
  reason?: string;
};

export type AdminConversationListFilters = {
  status?: string;
  type?: string;
  moderationStatus?: string;
  userId?: string;
  providerId?: string;
  conversationId?: string;
  bookingId?: string;
  q?: string;
};

export type AdminConversationListItem = {
  conversationId: string;
  type: string;
  status: string;
  bookingId: string | null;
  userId: string | null;
  providerId: string | null;
  user: {
    userId: string | null;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
  } | null;
  provider: {
    providerId: string | null;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
  } | null;
  participantIds: string[];
  lastMessage: {
    messageId: string | null;
    senderUid: string | null;
    type: string | null;
    preview: string | null;
    createdAt: string | null;
  } | null;
  moderationStatus: ConversationModerationStatus;
  moderationNote: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminConversationParticipant = {
  membershipId: string;
  conversationId: string;
  uid: string;
  role: string;
  unreadCount: number;
  lastReadMessageId: string | null;
  lastMessageAt: string | null;
  blockedAt: string | null;
  blockedBy: {
    uid: string | null;
    role: string | null;
  } | null;
  blockReason: string | null;
  otherParticipantSnapshot: {
    uid: string | null;
    displayName: string | null;
    avatarPath: string | null;
  };
  profile: {
    displayName: string | null;
    email: string | null;
    role: string | null;
  } | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminConversationDetail = {
  item: AdminConversationListItem;
  participants: AdminConversationParticipant[];
};

export type AdminConversationMessageItem = {
  messageId: string;
  conversationId: string;
  senderUid: string | null;
  senderRole: string | null;
  senderSnapshot: {
    displayName: string | null;
    email: string | null;
    role: string | null;
  } | null;
  type: string;
  body: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  editedAt: string | null;
  deletedAt: string | null;
};

export type AdminCursorPage = {
  nextCursor: string | null;
  hasMore: boolean;
};

export class AdminConversationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AdminConversationError";
  }
}

type CursorPayload = {
  millis: number;
};

function readString(value: unknown) {
  return String(value || "").trim();
}

function normalizeText(value: unknown) {
  return readString(value).toLowerCase();
}

function toIso(value: unknown) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toMillis(value: unknown) {
  if (!value) {
    return 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof (value as { toMillis?: () => number })?.toMillis === "function") {
    return Number((value as { toMillis: () => number }).toMillis()) || 0;
  }
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeModerationStatus(value: unknown): ConversationModerationStatus {
  const status = readString(value);
  if (status === "flagged" || status === "under_review" || status === "resolved") {
    return status;
  }
  return "none";
}

async function loadByIds(collectionName: string, ids: string[]) {
  if (!ids.length) {
    return new Map<string, Record<string, unknown>>();
  }
  try {
    const db = getAdminDb();
    const snapshots = await Promise.all(ids.map((id) => db.collection(collectionName).doc(id).get()));
    const map = new Map<string, Record<string, unknown>>();
    snapshots.forEach((snap) => {
      if (snap.exists) {
        map.set(snap.id, (snap.data() || {}) as Record<string, unknown>);
      }
    });
    return map;
  } catch {
    return new Map<string, Record<string, unknown>>();
  }
}

function mapProviderDisplayName(provider: Record<string, unknown> | null) {
  const profile = (provider?.professionalProfile as Record<string, unknown> | undefined) || {};
  return readString(profile.displayName)
    || readString(profile.businessName)
    || readString(provider?.displayName)
    || null;
}

function serializeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function parseCursor(input: string | undefined | null): CursorPayload | null {
  const raw = readString(input);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Record<string, unknown>;
    const millis = Number(parsed.millis);
    if (!Number.isFinite(millis) || millis <= 0) {
      throw new Error("invalid cursor millis");
    }
    return { millis };
  } catch {
    throw new AdminConversationError("Cursor invalid pentru paginare.", 400);
  }
}

function buildConversationItem(
  conversationId: string,
  source: Record<string, unknown>
): AdminConversationListItem {
  const moderation = (source.adminModeration as Record<string, unknown> | undefined) || {};
  const moderationStatus = normalizeModerationStatus(source.moderationStatus || moderation.status);
  const lastMessage = (source.lastMessage as Record<string, unknown> | undefined) || null;

  return {
    conversationId,
    type: readString(source.type) || "direct",
    status: readString(source.status) || "active",
    bookingId: readString(source.bookingId) || null,
    userId: readString(source.userId) || null,
    providerId: readString(source.providerId) || null,
    user: null,
    provider: null,
    participantIds: Array.isArray(source.participantIds)
      ? source.participantIds.map((item) => readString(item)).filter(Boolean)
      : [],
    lastMessage: lastMessage
      ? {
        messageId: readString(lastMessage.messageId) || null,
        senderUid: readString(lastMessage.senderUid) || null,
        type: readString(lastMessage.type) || null,
        preview: readString(lastMessage.preview) || null,
        createdAt: toIso(lastMessage.createdAt),
      }
      : null,
    moderationStatus,
    moderationNote: readString(moderation.note) || null,
    updatedAt: toIso(source.updatedAt),
    createdAt: toIso(source.createdAt),
  };
}

function matchesIdOnlySearch(item: AdminConversationListItem, query: string) {
  if (!query) {
    return true;
  }
  const token = query.toLowerCase();
  return [item.conversationId, item.bookingId, item.userId, item.providerId]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

function matchesStructuredFilters(item: AdminConversationListItem, filters: AdminConversationListFilters) {
  const status = readString(filters.status);
  const type = readString(filters.type);
  const moderationStatus = readString(filters.moderationStatus);
  const userId = readString(filters.userId);
  const providerId = readString(filters.providerId);

  if (status && readString(item.status) !== status) {
    return false;
  }
  if (type && readString(item.type) !== type) {
    return false;
  }
  if (moderationStatus && readString(item.moderationStatus) !== moderationStatus) {
    return false;
  }
  if (userId && readString(item.userId) !== userId) {
    return false;
  }
  if (providerId && readString(item.providerId) !== providerId) {
    return false;
  }
  return true;
}

function buildParticipantItem(
  membershipId: string,
  source: Record<string, unknown>,
  profilesByUid?: Map<string, { displayName: string | null; email: string | null; role: string | null }>
): AdminConversationParticipant {
  const other = (source.otherParticipantSnapshot as Record<string, unknown> | undefined) || {};
  const blockedBy = (source.blockedBy as Record<string, unknown> | undefined) || {};

  return {
    membershipId,
    conversationId: readString(source.conversationId),
    uid: readString(source.uid),
    role: readString(source.role),
    unreadCount: Number(source.unreadCount) || 0,
    lastReadMessageId: readString(source.lastReadMessageId) || null,
    lastMessageAt: toIso(source.lastMessageAt),
    blockedAt: toIso(source.blockedAt),
    blockedBy: toIso(source.blockedAt)
      ? {
        uid: readString(blockedBy.uid) || null,
        role: readString(blockedBy.role) || null,
      }
      : null,
    blockReason: readString(source.blockReason) || null,
    otherParticipantSnapshot: {
      uid: readString(other.uid) || null,
      displayName: readString(other.displayName) || null,
      avatarPath: readString(other.avatarPath) || null,
    },
    profile: readString(source.uid) && profilesByUid?.has(readString(source.uid))
      ? profilesByUid.get(readString(source.uid)) || null
      : null,
    updatedAt: toIso(source.updatedAt),
    createdAt: toIso(source.createdAt),
  };
}

function buildMessageItem(
  messageId: string,
  source: Record<string, unknown>,
  profilesByUid?: Map<string, { displayName: string | null; email: string | null; role: string | null }>
): AdminConversationMessageItem {
  const senderUid = readString(source.senderUid) || null;
  return {
    messageId,
    conversationId: readString(source.conversationId),
    senderUid,
    senderRole: readString(source.senderRole) || null,
    senderSnapshot: senderUid && profilesByUid?.has(senderUid)
      ? profilesByUid.get(senderUid) || null
      : null,
    type: readString(source.type) || "text",
    body: readString(source.body),
    status: readString(source.status) || "sent",
    createdAt: toIso(source.createdAt),
    updatedAt: toIso(source.updatedAt),
    editedAt: toIso(source.editedAt),
    deletedAt: toIso(source.deletedAt),
  };
}

async function enrichConversationPeople(items: AdminConversationListItem[]) {
  if (!items.length) {
    return items;
  }
  const userIds = Array.from(new Set(items.map((item) => readString(item.userId)).filter(Boolean)));
  const providerIds = Array.from(new Set(items.map((item) => readString(item.providerId)).filter(Boolean)));
  const [usersById, providersById] = await Promise.all([
    loadByIds("users", userIds),
    loadByIds("providers", providerIds),
  ]);

  return items.map((item) => {
    const userId = readString(item.userId);
    const providerId = readString(item.providerId);
    const user = userId ? usersById.get(userId) || null : null;
    const provider = providerId ? providersById.get(providerId) || null : null;
    return {
      ...item,
      user: userId ? {
        userId,
        displayName: readString(user?.displayName) || null,
        email: readString(user?.email) || null,
        phoneNumber: readString(user?.phoneNumber) || null,
      } : null,
      provider: providerId ? {
        providerId,
        displayName: mapProviderDisplayName(provider),
        email: readString(provider?.email) || null,
        phoneNumber: readString(provider?.phoneNumber) || null,
      } : null,
    };
  });
}

async function buildProfilesByUid(uids: string[]) {
  const deduped = Array.from(new Set(uids.map((uid) => readString(uid)).filter(Boolean)));
  if (!deduped.length) {
    return new Map<string, { displayName: string | null; email: string | null; role: string | null }>();
  }
  const [usersById, providersById, adminsById] = await Promise.all([
    loadByIds("users", deduped),
    loadByIds("providers", deduped),
    loadByIds("admini", deduped),
  ]);
  const profiles = new Map<string, { displayName: string | null; email: string | null; role: string | null }>();
  deduped.forEach((uid) => {
    const admin = adminsById.get(uid) || null;
    if (admin) {
      profiles.set(uid, {
        displayName: readString(admin.displayName) || null,
        email: readString(admin.email) || null,
        role: readString(admin.role) || "admin",
      });
      return;
    }
    const provider = providersById.get(uid) || null;
    if (provider) {
      profiles.set(uid, {
        displayName: mapProviderDisplayName(provider),
        email: readString(provider.email) || null,
        role: "provider",
      });
      return;
    }
    const user = usersById.get(uid) || null;
    if (user) {
      profiles.set(uid, {
        displayName: readString(user.displayName) || null,
        email: readString(user.email) || null,
        role: readString(user.role) || "user",
      });
    }
  });
  return profiles;
}

async function getConversationById(conversationId: string) {
  const db = getAdminDb();
  const snap = await db.collection("conversations").doc(conversationId).get();
  if (!snap.exists) {
    return null;
  }
  const data = (snap.data() || {}) as Record<string, unknown>;
  return buildConversationItem(conversationId, data);
}

function pickDirectConversationId(filters: AdminConversationListFilters) {
  const conversationId = readString(filters.conversationId);
  if (conversationId) {
    return conversationId;
  }

  const bookingId = readString(filters.bookingId);
  if (bookingId) {
    return `conv_bk_${bookingId}`;
  }

  const query = readString(filters.q);
  if (query.startsWith("conv_")) {
    return query;
  }
  if (query.startsWith("bk_")) {
    return `conv_bk_${query}`;
  }

  return "";
}

export async function listAdminConversations(
  filters: AdminConversationListFilters,
  options?: { limit?: number; cursor?: string | null }
): Promise<{ items: AdminConversationListItem[]; page: AdminCursorPage }> {
  const db = getAdminDb();
  const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
  const cursor = parseCursor(options?.cursor || null);
  const queryText = normalizeText(filters.q);

  const directId = pickDirectConversationId(filters);
  if (directId) {
    const directItem = await getConversationById(directId);
    if (!directItem) {
      return {
        items: [],
        page: { nextCursor: null, hasMore: false },
      };
    }

    if (!matchesStructuredFilters(directItem, filters) || !matchesIdOnlySearch(directItem, queryText)) {
      return {
        items: [],
        page: { nextCursor: null, hasMore: false },
      };
    }

    const enriched = await enrichConversationPeople([directItem]);
    return {
      items: enriched,
      page: { nextCursor: null, hasMore: false },
    };
  }

  const status = readString(filters.status);
  const type = readString(filters.type);
  const moderationStatus = readString(filters.moderationStatus);
  const userId = readString(filters.userId);
  const providerId = readString(filters.providerId);
  const scanLimit = Math.min(limit * 4, 200);

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("conversations");

  if (status) {
    query = query.where("status", "==", status);
  }
  if (type) {
    query = query.where("type", "==", type);
  }
  if (userId) {
    query = query.where("userId", "==", userId);
  }
  if (providerId) {
    query = query.where("providerId", "==", providerId);
  }
  const canQueryModerationDirectly = Boolean(
    moderationStatus && !status && !type && !userId && !providerId
  );
  if (canQueryModerationDirectly) {
    query = query.where("moderationStatus", "==", moderationStatus);
  }

  query = query.orderBy("updatedAt", "desc");

  if (cursor) {
    query = query.startAfter(new Date(cursor.millis));
  }

  const snapshot = await query.limit(scanLimit + 1).get();
  const hasRawMore = snapshot.docs.length > scanLimit;
  const scannedDocs = hasRawMore ? snapshot.docs.slice(0, scanLimit) : snapshot.docs;

  const mapped = scannedDocs.map((doc) =>
    buildConversationItem(doc.id, (doc.data() || {}) as Record<string, unknown>)
  );
  const filtered = mapped
    .filter((item) => !moderationStatus || readString(item.moderationStatus) === moderationStatus)
    .filter((item) => matchesIdOnlySearch(item, queryText));

  const items = await enrichConversationPeople(filtered.slice(0, limit));
  const lastScannedDoc = scannedDocs[scannedDocs.length - 1];
  const nextCursor = (hasRawMore || filtered.length > limit) && lastScannedDoc
    ? serializeCursor({ millis: toMillis(lastScannedDoc.get("updatedAt")) })
    : null;

  return {
    items,
    page: {
      nextCursor,
      hasMore: Boolean(nextCursor),
    },
  };
}

export async function getAdminConversationDetail(
  conversationIdInput: string
): Promise<AdminConversationDetail> {
  const conversationId = readString(conversationIdInput);
  if (!conversationId) {
    throw new AdminConversationError("Conversation id este obligatoriu.", 400);
  }

  const db = getAdminDb();
  const conversationSnap = await db.collection("conversations").doc(conversationId).get();

  if (!conversationSnap.exists) {
    throw new AdminConversationError("Conversația nu există.", 404);
  }

  const baseItem = buildConversationItem(
    conversationId,
    (conversationSnap.data() || {}) as Record<string, unknown>
  );

  const membersSnap = await db
    .collection("conversationMemberships")
    .where("conversationId", "==", conversationId)
    .limit(20)
    .get();

  const participantSources = membersSnap.docs.map((doc) => ({
    id: doc.id,
    data: (doc.data() || {}) as Record<string, unknown>,
  }));
  const participantUids = participantSources.map((item) => readString(item.data.uid)).filter(Boolean);
  const profilesByUid = await buildProfilesByUid(participantUids);

  const participants = participantSources
    .map((doc) => buildParticipantItem(doc.id, doc.data, profilesByUid))
    .sort((first, second) => first.role.localeCompare(second.role));
  const [item] = await enrichConversationPeople([baseItem]);

  return {
    item,
    participants,
  };
}

export async function listAdminConversationMessages(
  conversationIdInput: string,
  options?: { limit?: number; cursor?: string | null }
): Promise<{ items: AdminConversationMessageItem[]; page: AdminCursorPage }> {
  const conversationId = readString(conversationIdInput);
  if (!conversationId) {
    throw new AdminConversationError("Conversation id este obligatoriu.", 400);
  }

  const limit = Math.min(Math.max(Number(options?.limit) || 30, 1), 100);
  const cursor = parseCursor(options?.cursor || null);
  const db = getAdminDb();
  const conversationRef = db.collection("conversations").doc(conversationId);
  const conversationSnap = await conversationRef.get();

  if (!conversationSnap.exists) {
    throw new AdminConversationError("Conversația nu există.", 404);
  }

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = conversationRef
    .collection("messages")
    .orderBy("createdAt", "desc");

  if (cursor) {
    query = query.startAfter(new Date(cursor.millis));
  }

  const snapshot = await query.limit(limit + 1).get();
  const hasMore = snapshot.docs.length > limit;
  const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
  const lastDoc = docs[docs.length - 1];
  const senderUids = docs.map((doc) => readString(doc.get("senderUid"))).filter(Boolean);
  const profilesByUid = await buildProfilesByUid(senderUids);

  return {
    items: docs.map((doc) => buildMessageItem(doc.id, (doc.data() || {}) as Record<string, unknown>, profilesByUid)),
    page: {
      nextCursor: hasMore && lastDoc
        ? serializeCursor({ millis: toMillis(lastDoc.get("createdAt")) })
        : null,
      hasMore,
    },
  };
}

export async function patchAdminConversationModeration(
  conversationIdInput: string,
  payload: ConversationModerationPayload,
  actor: { uid: string; role: "admin" | "support" }
): Promise<AdminConversationListItem> {
  const conversationId = readString(conversationIdInput);
  if (!conversationId) {
    throw new AdminConversationError("Conversation id este obligatoriu.", 400);
  }

  const hasStatus = payload.status !== undefined;
  const hasNote = payload.note !== undefined;
  if (!hasStatus && !hasNote) {
    throw new AdminConversationError("Trimite status sau notă pentru moderare.", 400);
  }

  const nextStatus = hasStatus ? normalizeModerationStatus(payload.status) : null;
  if (hasStatus && payload.status !== nextStatus) {
    throw new AdminConversationError("Status de moderare invalid.", 400);
  }

  const db = getAdminDb();
  const conversationRef = db.collection("conversations").doc(conversationId);
  const conversationSnap = await conversationRef.get();

  if (!conversationSnap.exists) {
    throw new AdminConversationError("Conversația nu există.", 404);
  }

  const current = (conversationSnap.data() || {}) as Record<string, unknown>;
  const moderation = (current.adminModeration as Record<string, unknown> | undefined) || {};
  const statusFrom = normalizeModerationStatus(moderation.status);
  const statusTo = nextStatus || statusFrom;
  const noteValue = hasNote
    ? readString(payload.note).slice(0, 2000)
    : readString(moderation.note);

  const now = Timestamp.now();
  await conversationRef.set(
    {
      moderationStatus: statusTo,
      adminModeration: {
        status: statusTo,
        note: noteValue || null,
        updatedBy: {
          uid: actor.uid,
          role: actor.role,
        },
        updatedAt: now,
      },
      updatedAt: now,
    },
    { merge: true }
  );

  const auditRef = db.collection("auditEvents").doc();
  const action = statusTo === "none" || statusTo === "resolved"
    ? "conversation.clear"
    : "conversation.flag";

  await auditRef.set({
    eventId: auditRef.id,
    action,
    actorUid: actor.uid,
    actorRole: actor.role,
    resourceType: "conversation",
    resourceId: conversationId,
    statusFrom,
    statusTo,
    result: "success",
    context: {
      note: noteValue || null,
    },
    createdAt: now,
  });

  const updatedSnap = await conversationRef.get();
  return buildConversationItem(
    conversationId,
    (updatedSnap.data() || {}) as Record<string, unknown>
  );
}

export async function patchAdminConversationParticipantBlock(
  conversationIdInput: string,
  participantUidInput: string,
  payload: ConversationParticipantBlockPayload,
  actor: { uid: string; role: "admin" | "support" }
): Promise<AdminConversationParticipant> {
  const conversationId = readString(conversationIdInput);
  const participantUid = readString(participantUidInput);

  if (!conversationId || !participantUid) {
    throw new AdminConversationError("Conversation id și participant uid sunt obligatorii.", 400);
  }

  if (typeof payload.blocked !== "boolean") {
    throw new AdminConversationError("Câmpul blocked este obligatoriu.", 400);
  }

  const db = getAdminDb();
  const conversationRef = db.collection("conversations").doc(conversationId);
  const conversationSnap = await conversationRef.get();

  if (!conversationSnap.exists) {
    throw new AdminConversationError("Conversația nu există.", 404);
  }

  const conversation = (conversationSnap.data() || {}) as Record<string, unknown>;
  const participantIds = Array.isArray(conversation.participantIds)
    ? conversation.participantIds.map((item) => readString(item)).filter(Boolean)
    : [];

  if (!participantIds.includes(participantUid)) {
    throw new AdminConversationError("Participantul nu aparține conversației.", 404);
  }

  const membershipId = `${conversationId}_${participantUid}`;
  const membershipRef = db.collection("conversationMemberships").doc(membershipId);
  const membershipSnap = await membershipRef.get();

  if (!membershipSnap.exists) {
    throw new AdminConversationError("Membership-ul participantului nu există.", 404);
  }

  const membership = (membershipSnap.data() || {}) as Record<string, unknown>;
  if (readString(membership.conversationId) !== conversationId) {
    throw new AdminConversationError("Membership invalid pentru conversația selectată.", 400);
  }

  const reason = readString(payload.reason).slice(0, 500);
  const now = Timestamp.now();

  await membershipRef.set(
    {
      blockedAt: payload.blocked ? now : null,
      blockedBy: payload.blocked
        ? {
          uid: actor.uid,
          role: actor.role,
        }
        : null,
      blockReason: payload.blocked ? (reason || null) : null,
      updatedAt: now,
    },
    { merge: true }
  );

  await conversationRef.set(
    {
      updatedAt: now,
    },
    { merge: true }
  );

  const auditRef = db.collection("auditEvents").doc();
  await auditRef.set({
    eventId: auditRef.id,
    action: payload.blocked
      ? "conversation.participant.block"
      : "conversation.participant.unblock",
    actorUid: actor.uid,
    actorRole: actor.role,
    resourceType: "conversation",
    resourceId: conversationId,
    result: "success",
    context: {
      participantUid,
      reason: payload.blocked ? (reason || null) : null,
    },
    createdAt: now,
  });

  const updatedMembershipSnap = await membershipRef.get();
  return buildParticipantItem(
    membershipId,
    (updatedMembershipSnap.data() || {}) as Record<string, unknown>
  );
}

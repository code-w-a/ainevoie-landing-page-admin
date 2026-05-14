import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicketTopic = "support" | "bug";

export type SupportTicketRelatedEntity = {
  bookingId: string | null;
  providerId: string | null;
  userId: string | null;
} | null;

export type SupportTicketPatchPayload = {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedAdminUid?: string | null;
  adminNote?: string | null;
  relatedEntity?: SupportTicketRelatedEntity;
};

export type SupportTicketListFilters = {
  status?: string;
  priority?: string;
  topic?: string;
  assignedAdminUid?: string;
  requesterUid?: string;
  relatedEntity?: string;
  q?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
};

export type SupportTicketListItem = {
  ticketId: string;
  topic: string;
  subject: string;
  initialMessage: string;
  status: string;
  priority: string;
  requesterUid: string;
  requesterRole: string;
  requesterSnapshot: {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
  };
  requester: {
    uid: string;
    role: string;
    displayName: string | null;
    email: string | null;
  };
  assignedAdminUid: string | null;
  assignedAdminSnapshot: {
    displayName: string | null;
    email: string | null;
    role: string | null;
  } | null;
  adminNote: string | null;
  relatedEntity: SupportTicketRelatedEntity;
  relatedBooking: {
    bookingId: string;
    status: string | null;
    scheduledStartAt: string | null;
  } | null;
  relatedUser: {
    userId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  relatedProvider: {
    providerId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  updatedBy: {
    uid: string | null;
    role: string | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaAgeMinutes: number;
};

export type SupportTicketListResult = {
  items: SupportTicketListItem[];
  total: number;
  truncated: boolean;
  maxRows: number;
};

const SUPPORT_TICKET_STATUSES = new Set([
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
]);
const SUPPORT_TICKET_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const SUPPORT_TICKET_TOPICS = new Set(["support", "bug"]);

export class AdminSupportTicketError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AdminSupportTicketError";
  }
}

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

function toNullableString(value: unknown) {
  const next = readString(value);
  return next || null;
}

function normalizeStatus(value: unknown) {
  const next = readString(value);
  return SUPPORT_TICKET_STATUSES.has(next) ? next : "open";
}

function normalizePriority(value: unknown) {
  const next = readString(value);
  return SUPPORT_TICKET_PRIORITIES.has(next) ? next : "normal";
}

function normalizeTopic(value: unknown) {
  const next = readString(value);
  return SUPPORT_TICKET_TOPICS.has(next) ? next : "support";
}

function normalizeRelatedEntity(value: unknown): SupportTicketRelatedEntity {
  if (!value || typeof value !== "object") {
    return null;
  }
  const source = value as Record<string, unknown>;
  const bookingId = toNullableString(source.bookingId);
  const providerId = toNullableString(source.providerId);
  const userId = toNullableString(source.userId);

  if (!bookingId && !providerId && !userId) {
    return null;
  }

  return {
    bookingId,
    providerId,
    userId,
  };
}

function readUniqueIds(items: Array<Record<string, unknown>>, fieldName: string) {
  const ids = new Set<string>();
  items.forEach((item) => {
    const value = readString(item[fieldName]);
    if (value) {
      ids.add(value);
    }
  });
  return [...ids];
}

function readUniqueRelatedIds(
  items: Array<Record<string, unknown>>,
  fieldName: "bookingId" | "providerId" | "userId"
) {
  const ids = new Set<string>();
  items.forEach((item) => {
    const related = normalizeRelatedEntity(item.relatedEntity);
    const value = related?.[fieldName] || "";
    if (value) {
      ids.add(value);
    }
  });
  return [...ids];
}

function mapById(snapshots: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[]) {
  const result = new Map<string, Record<string, unknown>>();
  snapshots.forEach((snapshot) => {
    if (snapshot.exists) {
      result.set(snapshot.id, (snapshot.data() || {}) as Record<string, unknown>);
    }
  });
  return result;
}

async function loadByIds(collectionName: string, ids: string[]) {
  if (!ids.length) {
    return new Map<string, Record<string, unknown>>();
  }
  const db = getAdminDb();
  const snapshots = await Promise.all(ids.map((id) => db.collection(collectionName).doc(id).get()));
  return mapById(snapshots);
}

function mapProviderDisplayName(provider: Record<string, unknown> | null) {
  const profile = (provider?.professionalProfile as Record<string, unknown> | undefined) || {};
  return readString(profile.displayName) || readString(provider?.displayName) || null;
}

function getRequesterProfile(
  requesterUid: string,
  requesterRole: string,
  usersById: Map<string, Record<string, unknown>>,
  providersById: Map<string, Record<string, unknown>>
) {
  if (requesterRole === "provider") {
    const provider = providersById.get(requesterUid) || null;
    return {
      displayName: mapProviderDisplayName(provider),
      email: toNullableString(provider?.email),
    };
  }

  const user = usersById.get(requesterUid) || null;
  return {
    displayName: toNullableString(user?.displayName),
    email: toNullableString(user?.email),
  };
}

function mapTicketItem(
  ticket: Record<string, unknown> & { ticketId: string },
  context: {
    nowMs: number;
    usersById: Map<string, Record<string, unknown>>;
    providersById: Map<string, Record<string, unknown>>;
    adminsById: Map<string, Record<string, unknown>>;
    bookingsById: Map<string, Record<string, unknown>>;
  }
): SupportTicketListItem {
  const requesterUid = readString(ticket.requesterUid);
  const requesterRole = readString(ticket.requesterRole) || "user";
  const requesterSnapshot =
    (ticket.requesterSnapshot as Record<string, unknown> | undefined) || {};
  const relatedEntity = normalizeRelatedEntity(ticket.relatedEntity);
  const assignedAdminUid = toNullableString(ticket.assignedAdminUid);
  const assignedAdminStored =
    (ticket.assignedAdminSnapshot as Record<string, unknown> | undefined) || {};
  const assignedAdminDoc = assignedAdminUid ? context.adminsById.get(assignedAdminUid) || null : null;
  const relatedBooking = relatedEntity?.bookingId
    ? context.bookingsById.get(relatedEntity.bookingId) || null
    : null;
  const relatedUser = relatedEntity?.userId ? context.usersById.get(relatedEntity.userId) || null : null;
  const relatedProvider = relatedEntity?.providerId
    ? context.providersById.get(relatedEntity.providerId) || null
    : null;
  const requesterProfile = getRequesterProfile(
    requesterUid,
    requesterRole,
    context.usersById,
    context.providersById
  );
  const createdAt = toIso(ticket.createdAt);
  const createdAtMs = toMillis(ticket.createdAt);

  return {
    ticketId: ticket.ticketId,
    topic: normalizeTopic(ticket.topic),
    subject: readString(ticket.subject),
    initialMessage: readString(ticket.initialMessage),
    status: normalizeStatus(ticket.status),
    priority: normalizePriority(ticket.priority),
    requesterUid,
    requesterRole,
    requesterSnapshot: {
      displayName: toNullableString(requesterSnapshot.displayName),
      email: toNullableString(requesterSnapshot.email),
      phoneNumber: toNullableString(requesterSnapshot.phoneNumber),
    },
    requester: {
      uid: requesterUid,
      role: requesterRole,
      displayName: requesterProfile.displayName || toNullableString(requesterSnapshot.displayName),
      email: requesterProfile.email || toNullableString(requesterSnapshot.email),
    },
    assignedAdminUid,
    assignedAdminSnapshot: assignedAdminUid
      ? {
        displayName:
          toNullableString(assignedAdminDoc?.displayName)
          || toNullableString(assignedAdminStored.displayName),
        email: toNullableString(assignedAdminDoc?.email) || toNullableString(assignedAdminStored.email),
        role: toNullableString(assignedAdminDoc?.role) || toNullableString(assignedAdminStored.role),
      }
      : null,
    adminNote: toNullableString(ticket.adminNote),
    relatedEntity,
    relatedBooking: relatedEntity?.bookingId
      ? {
        bookingId: relatedEntity.bookingId,
        status: toNullableString(relatedBooking?.status),
        scheduledStartAt: toIso(relatedBooking?.scheduledStartAt),
      }
      : null,
    relatedUser: relatedEntity?.userId
      ? {
        userId: relatedEntity.userId,
        displayName: toNullableString(relatedUser?.displayName),
        email: toNullableString(relatedUser?.email),
      }
      : null,
    relatedProvider: relatedEntity?.providerId
      ? {
        providerId: relatedEntity.providerId,
        displayName: mapProviderDisplayName(relatedProvider),
        email: toNullableString(relatedProvider?.email),
      }
      : null,
    updatedBy: {
      uid: toNullableString((ticket.updatedBy as Record<string, unknown> | undefined)?.uid),
      role: toNullableString((ticket.updatedBy as Record<string, unknown> | undefined)?.role),
    },
    createdAt,
    updatedAt: toIso(ticket.updatedAt),
    resolvedAt: toIso(ticket.resolvedAt),
    closedAt: toIso(ticket.closedAt),
    slaAgeMinutes: createdAtMs > 0 ? Math.max(0, Math.floor((context.nowMs - createdAtMs) / 60_000)) : 0,
  };
}

function matchesSearch(item: SupportTicketListItem, query: string) {
  if (!query) {
    return true;
  }
  const token = query.toLowerCase();
  return [
    item.ticketId,
    item.topic,
    item.subject,
    item.initialMessage,
    item.status,
    item.priority,
    item.requesterUid,
    item.requesterRole,
    item.requester.displayName,
    item.requester.email,
    item.assignedAdminUid,
    item.assignedAdminSnapshot?.displayName,
    item.assignedAdminSnapshot?.email,
    item.adminNote,
    item.relatedEntity?.bookingId,
    item.relatedEntity?.providerId,
    item.relatedEntity?.userId,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

function matchesRelatedEntity(item: SupportTicketListItem, relatedEntity: string) {
  if (!relatedEntity) {
    return true;
  }
  const token = relatedEntity.toLowerCase();
  return [item.relatedEntity?.bookingId, item.relatedEntity?.providerId, item.relatedEntity?.userId]
    .map((value) => normalizeText(value))
    .some((value) => value === token || value.includes(token));
}

export async function listAdminSupportTickets(
  filters: SupportTicketListFilters,
  options?: { maxRows?: number; now?: Date }
): Promise<SupportTicketListResult> {
  const db = getAdminDb();
  const maxRows = Math.max(1, Math.floor(options?.maxRows || 5000));
  const nowMs = (options?.now || new Date()).getTime();

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    db.collection("supportTickets");

  const status = readString(filters.status);
  const priority = readString(filters.priority);
  const topic = readString(filters.topic);
  const assignedAdminUid = readString(filters.assignedAdminUid);
  const requesterUid = readString(filters.requesterUid);

  if (status) {
    query = query.where("status", "==", status);
  }
  if (priority) {
    query = query.where("priority", "==", priority);
  }
  if (topic) {
    query = query.where("topic", "==", topic);
  }
  if (assignedAdminUid) {
    query = query.where("assignedAdminUid", "==", assignedAdminUid);
  }
  if (requesterUid) {
    query = query.where("requesterUid", "==", requesterUid);
  }
  if (filters.dateFrom instanceof Date) {
    query = query.where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom));
  }
  if (filters.dateTo instanceof Date) {
    query = query.where("createdAt", "<=", Timestamp.fromDate(filters.dateTo));
  }

  const snapshot = await query.orderBy("createdAt", "desc").limit(maxRows + 1).get();
  const truncated = snapshot.docs.length > maxRows;
  const docs = truncated ? snapshot.docs.slice(0, maxRows) : snapshot.docs;
  const tickets: Array<Record<string, unknown> & { ticketId: string }> = docs.map((item) => ({
    ticketId: item.id,
    ...item.data(),
  }));

  const requesterUserIds = tickets
    .filter((item) => readString(item.requesterRole) !== "provider")
    .map((item) => readString(item.requesterUid))
    .filter(Boolean);
  const requesterProviderIds = tickets
    .filter((item) => readString(item.requesterRole) === "provider")
    .map((item) => readString(item.requesterUid))
    .filter(Boolean);
  const relatedUserIds = readUniqueRelatedIds(tickets, "userId");
  const relatedProviderIds = readUniqueRelatedIds(tickets, "providerId");
  const relatedBookingIds = readUniqueRelatedIds(tickets, "bookingId");
  const assigneeIds = readUniqueIds(tickets, "assignedAdminUid");

  const [usersById, providersById, bookingsById, adminsById] = await Promise.all([
    loadByIds("users", [...new Set([...requesterUserIds, ...relatedUserIds])]),
    loadByIds("providers", [...new Set([...requesterProviderIds, ...relatedProviderIds])]),
    loadByIds("bookings", relatedBookingIds),
    loadByIds("admini", assigneeIds),
  ]);

  const mapped = tickets.map((ticket) =>
    mapTicketItem(ticket, {
      nowMs,
      usersById,
      providersById,
      adminsById,
      bookingsById,
    })
  );

  const queryText = normalizeText(filters.q);
  const relatedEntityFilter = normalizeText(filters.relatedEntity);

  const filtered = mapped
    .filter((item) => matchesRelatedEntity(item, relatedEntityFilter))
    .filter((item) => matchesSearch(item, queryText))
    .sort((first, second) => toMillis(second.updatedAt || second.createdAt) - toMillis(first.updatedAt || first.createdAt));

  return {
    items: filtered,
    total: filtered.length,
    truncated,
    maxRows,
  };
}

function sanitizePatchStatus(value: unknown) {
  const next = readString(value);
  return SUPPORT_TICKET_STATUSES.has(next)
    ? (next as SupportTicketStatus)
    : null;
}

function sanitizePatchPriority(value: unknown) {
  const next = readString(value);
  return SUPPORT_TICKET_PRIORITIES.has(next)
    ? (next as SupportTicketPriority)
    : null;
}

function sanitizePatchRelatedEntity(value: unknown): SupportTicketRelatedEntity {
  if (value == null) {
    return null;
  }
  return normalizeRelatedEntity(value);
}

function mapAdminSnapshot(data: Record<string, unknown> | null) {
  if (!data) {
    return null;
  }
  return {
    displayName: toNullableString(data.displayName),
    email: toNullableString(data.email),
    role: toNullableString(data.role),
  };
}

async function getSupportTicketById(ticketId: string, now = new Date()) {
  const db = getAdminDb();
  const snap = await db.collection("supportTickets").doc(ticketId).get();
  if (!snap.exists) {
    return null;
  }

  const ticket: Record<string, unknown> & { ticketId: string } = {
    ticketId,
    ...(snap.data() || {}),
  };

  const requesterUid = readString(ticket.requesterUid);
  const requesterRole = readString(ticket.requesterRole);
  const relatedEntity = normalizeRelatedEntity(ticket.relatedEntity);
  const userIds = new Set<string>();
  const providerIds = new Set<string>();

  if (requesterRole === "provider") {
    if (requesterUid) providerIds.add(requesterUid);
  } else if (requesterUid) {
    userIds.add(requesterUid);
  }

  if (relatedEntity?.userId) userIds.add(relatedEntity.userId);
  if (relatedEntity?.providerId) providerIds.add(relatedEntity.providerId);

  const [usersById, providersById, bookingsById, adminsById] = await Promise.all([
    loadByIds("users", [...userIds]),
    loadByIds("providers", [...providerIds]),
    loadByIds("bookings", relatedEntity?.bookingId ? [relatedEntity.bookingId] : []),
    loadByIds("admini", readString(ticket.assignedAdminUid) ? [readString(ticket.assignedAdminUid)] : []),
  ]);

  return mapTicketItem(ticket, {
    nowMs: now.getTime(),
    usersById,
    providersById,
    adminsById,
    bookingsById,
  });
}

export async function patchAdminSupportTicket(
  ticketIdInput: string,
  payload: SupportTicketPatchPayload,
  actor: { uid: string; role: "admin" | "support" }
): Promise<SupportTicketListItem> {
  const ticketId = readString(ticketIdInput);
  if (!ticketId) {
    throw new AdminSupportTicketError("Ticket id este obligatoriu.", 400);
  }

  const hasStatus = payload.status !== undefined;
  const hasPriority = payload.priority !== undefined;
  const hasAssignee = payload.assignedAdminUid !== undefined;
  const hasNote = payload.adminNote !== undefined;
  const hasRelatedEntity = payload.relatedEntity !== undefined;

  if (!hasStatus && !hasPriority && !hasAssignee && !hasNote && !hasRelatedEntity) {
    throw new AdminSupportTicketError("Trimite cel puțin un câmp pentru actualizare.", 400);
  }

  const db = getAdminDb();
  const ticketRef = db.collection("supportTickets").doc(ticketId);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new AdminSupportTicketError("Ticket-ul nu există.", 404);
  }

  const current = (ticketSnap.data() || {}) as Record<string, unknown>;
  const nextStatus = hasStatus ? sanitizePatchStatus(payload.status) : null;
  const nextPriority = hasPriority ? sanitizePatchPriority(payload.priority) : null;

  if (hasStatus && !nextStatus) {
    throw new AdminSupportTicketError("Status ticket invalid.", 400);
  }
  if (hasPriority && !nextPriority) {
    throw new AdminSupportTicketError("Prioritate ticket invalidă.", 400);
  }

  const now = Timestamp.now();
  const currentStatus = normalizeStatus(current.status);
  const statusTo = hasStatus && nextStatus ? nextStatus : currentStatus;
  const priorityTo = hasPriority && nextPriority ? nextPriority : normalizePriority(current.priority);
  const currentAdminNote = toNullableString(current.adminNote);
  const adminNoteTo = hasNote ? toNullableString(payload.adminNote) : currentAdminNote;

  let assignedAdminUidTo = toNullableString(current.assignedAdminUid);
  let assignedAdminSnapshotTo =
    mapAdminSnapshot((current.assignedAdminSnapshot as Record<string, unknown> | undefined) || null);

  if (hasAssignee) {
    const nextAssignee = toNullableString(payload.assignedAdminUid);
    if (!nextAssignee) {
      assignedAdminUidTo = null;
      assignedAdminSnapshotTo = null;
    } else {
      const adminSnap = await db.collection("admini").doc(nextAssignee).get();
      const adminData = adminSnap.exists
        ? (adminSnap.data() as Record<string, unknown>)
        : null;
      assignedAdminUidTo = nextAssignee;
      assignedAdminSnapshotTo = mapAdminSnapshot(adminData);
    }
  }

  const relatedEntityTo = hasRelatedEntity
    ? sanitizePatchRelatedEntity(payload.relatedEntity)
    : normalizeRelatedEntity(current.relatedEntity);

  const updatePayload: Record<string, unknown> = {
    status: statusTo,
    priority: priorityTo,
    adminNote: adminNoteTo,
    assignedAdminUid: assignedAdminUidTo,
    assignedAdminSnapshot: assignedAdminSnapshotTo,
    relatedEntity: relatedEntityTo,
    updatedAt: now,
    updatedBy: {
      uid: actor.uid,
      role: actor.role,
    },
  };

  if (hasStatus) {
    if (statusTo === "closed") {
      updatePayload.closedAt = current.closedAt || now;
      updatePayload.resolvedAt = current.resolvedAt || now;
    } else if (statusTo === "resolved") {
      updatePayload.resolvedAt = current.resolvedAt || now;
      updatePayload.closedAt = null;
    } else {
      updatePayload.resolvedAt = null;
      updatePayload.closedAt = null;
    }
  }

  await ticketRef.set(updatePayload, { merge: true });

  const refreshed = await getSupportTicketById(ticketId, new Date());
  if (!refreshed) {
    throw new AdminSupportTicketError("Ticket-ul nu există.", 404);
  }

  return refreshed;
}

import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export type ReviewStatus = "published" | "hidden_by_admin" | "deleted_by_admin";

export type ReviewModerationPayload = {
  status?: ReviewStatus;
  note?: string;
};

export type ReviewAdminListItem = {
  reviewId: string;
  bookingId: string;
  providerId: string;
  authorUserId: string;
  status: ReviewStatus | string;
  rating: number;
  review: string;
  createdAt: string | null;
  updatedAt: string | null;
  authorSnapshot: {
    displayName: string | null;
  };
  providerSnapshot: {
    displayName: string | null;
  };
  serviceSnapshot: {
    serviceName: string | null;
  };
  booking: {
    bookingId: string;
    status: string | null;
    scheduledStartAt: string | null;
  } | null;
  user: {
    userId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  provider: {
    providerId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  adminModeration: {
    note: string | null;
    updatedBy: string | null;
    updatedAt: string | null;
  };
};

export type ReviewListFilters = {
  status?: string;
  providerId?: string;
  userId?: string;
  ratingMin?: number;
  ratingMax?: number;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  q?: string;
};

export type ReviewListResult = {
  items: ReviewAdminListItem[];
  total: number;
  truncated: boolean;
  maxRows: number;
};

export class AdminReviewError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AdminReviewError";
  }
}

function readString(value: unknown) {
  return String(value || "").trim();
}

function readNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function normalizeText(value: unknown) {
  return readString(value).toLowerCase();
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
  const snapshots = await Promise.all(
    ids.map((id) => db.collection(collectionName).doc(id).get())
  );
  return mapById(snapshots);
}

function readUniqueIds(items: Array<Record<string, unknown> & { reviewId: string }>, fieldName: string) {
  const ids = new Set<string>();
  items.forEach((item) => {
    const value = readString(item[fieldName]);
    if (value) {
      ids.add(value);
    }
  });
  return [...ids];
}

function matchesSearch(item: ReviewAdminListItem, query: string) {
  if (!query) {
    return true;
  }
  const token = query.toLowerCase();
  return [
    item.reviewId,
    item.bookingId,
    item.providerId,
    item.authorUserId,
    item.review,
    item.authorSnapshot.displayName,
    item.providerSnapshot.displayName,
    item.serviceSnapshot.serviceName,
    item.user?.displayName,
    item.user?.email,
    item.provider?.displayName,
    item.provider?.email,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

function toReviewItem(
  review: Record<string, unknown> & { reviewId: string },
  booking: Record<string, unknown> | null,
  user: Record<string, unknown> | null,
  provider: Record<string, unknown> | null
): ReviewAdminListItem {
  const bookingId = readString(review.bookingId) || review.reviewId;
  const providerId = readString(review.providerId);
  const authorUserId = readString(review.authorUserId);
  const authorSnapshot = (review.authorSnapshot as Record<string, unknown> | undefined) || {};
  const providerSnapshot = (review.providerSnapshot as Record<string, unknown> | undefined) || {};
  const serviceSnapshot = (review.serviceSnapshot as Record<string, unknown> | undefined) || {};
  const moderation = (review.adminModeration as Record<string, unknown> | undefined) || {};
  const profile = (provider?.professionalProfile as Record<string, unknown> | undefined) || {};
  const bookingServiceSnapshot =
    (booking?.serviceSnapshot as Record<string, unknown> | undefined) || {};

  return {
    reviewId: review.reviewId,
    bookingId,
    providerId,
    authorUserId,
    status: readString(review.status),
    rating: readNumber(review.rating),
    review: readString(review.review),
    createdAt: toIso(review.createdAt),
    updatedAt: toIso(review.updatedAt),
    authorSnapshot: {
      displayName: readString(authorSnapshot.displayName) || null,
    },
    providerSnapshot: {
      displayName: readString(providerSnapshot.displayName) || null,
    },
    serviceSnapshot: {
      serviceName:
        readString(serviceSnapshot.serviceName)
        || readString(bookingServiceSnapshot.name)
        || null,
    },
    booking: booking ? {
      bookingId,
      status: readString(booking.status) || null,
      scheduledStartAt: toIso(booking.scheduledStartAt),
    } : null,
    user: user ? {
      userId: authorUserId,
      displayName: readString(user.displayName) || null,
      email: readString(user.email) || null,
    } : null,
    provider: provider ? {
      providerId,
      displayName:
        readString(profile.displayName)
        || readString(providerSnapshot.displayName)
        || null,
      email: readString(provider.email) || null,
    } : null,
    adminModeration: {
      note: readString(moderation.note) || null,
      updatedBy: readString(moderation.updatedBy) || null,
      updatedAt: toIso(moderation.updatedAt),
    },
  };
}

export async function listAdminReviews(
  filters: ReviewListFilters,
  options?: { maxRows?: number }
): Promise<ReviewListResult> {
  const db = getAdminDb();
  const maxRows = Math.max(1, Math.floor(options?.maxRows || 5000));
  const status = readString(filters.status);
  const providerId = readString(filters.providerId);
  const authorUserId = readString(filters.userId);

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    db.collection("reviews");

  if (status) {
    query = query.where("status", "==", status);
  }
  if (providerId) {
    query = query.where("providerId", "==", providerId);
  }
  if (authorUserId) {
    query = query.where("authorUserId", "==", authorUserId);
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
  const reviews: Array<Record<string, unknown> & { reviewId: string }> = docs.map((doc) => ({
    reviewId: doc.id,
    ...doc.data(),
  }));

  const bookingIds = readUniqueIds(reviews, "bookingId");
  const userIds = readUniqueIds(reviews, "authorUserId");
  const providerIds = readUniqueIds(reviews, "providerId");
  const [bookingsById, usersById, providersById] = await Promise.all([
    loadByIds("bookings", bookingIds),
    loadByIds("users", userIds),
    loadByIds("providers", providerIds),
  ]);

  const ratingMin = Number.isFinite(Number(filters.ratingMin))
    ? Number(filters.ratingMin)
    : null;
  const ratingMax = Number.isFinite(Number(filters.ratingMax))
    ? Number(filters.ratingMax)
    : null;
  const queryText = normalizeText(filters.q);

  const mapped = reviews.map((review) => {
    const bookingId = readString(review.bookingId) || review.reviewId;
    const nextProviderId = readString(review.providerId);
    const nextUserId = readString(review.authorUserId);
    const booking = bookingsById.get(bookingId) || null;
    const user = usersById.get(nextUserId) || null;
    const provider = providersById.get(nextProviderId) || null;
    return toReviewItem(review, booking, user, provider);
  });

  const filtered = mapped
    .filter((item) => (ratingMin == null ? true : item.rating >= ratingMin))
    .filter((item) => (ratingMax == null ? true : item.rating <= ratingMax))
    .filter((item) => matchesSearch(item, queryText))
    .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt));

  return {
    items: filtered,
    total: filtered.length,
    truncated,
    maxRows,
  };
}

export async function moderateAdminReview(
  reviewIdInput: string,
  payload: ReviewModerationPayload,
  actor: { uid: string }
): Promise<ReviewAdminListItem> {
  const reviewId = readString(reviewIdInput);
  if (!reviewId) {
    throw new AdminReviewError("Review id este obligatoriu.", 400);
  }

  const nextStatus = readString(payload.status);
  const hasStatus = Boolean(nextStatus);
  const hasNote = payload.note !== undefined;
  if (!hasStatus && !hasNote) {
    throw new AdminReviewError("Trimite status sau notă pentru moderare.", 400);
  }
  if (
    hasStatus
    && nextStatus !== "published"
    && nextStatus !== "hidden_by_admin"
    && nextStatus !== "deleted_by_admin"
  ) {
    throw new AdminReviewError("Status de review invalid.", 400);
  }

  const db = getAdminDb();
  const reviewRef = db.collection("reviews").doc(reviewId);
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) {
    throw new AdminReviewError("Review-ul nu există.", 404);
  }

  const current = (reviewSnap.data() || {}) as Record<string, unknown>;
  const now = Timestamp.now();
  const currentStatus = readString(current.status);
  const statusTo = hasStatus ? nextStatus : currentStatus;
  if (currentStatus === "deleted_by_admin" && nextStatus === "published") {
    throw new AdminReviewError(
      "Review-ul șters de admin nu poate fi republicat prin moderarea standard.",
      400
    );
  }
  const currentModeration =
    (current.adminModeration as Record<string, unknown> | undefined) || {};
  const noteValue = hasNote ? String(payload.note || "").trim() : readString(currentModeration.note);
  const auditAction = hasStatus && nextStatus === "deleted_by_admin"
    ? "review.delete"
    : "review.moderate";

  await reviewRef.set(
    {
      status: statusTo,
      updatedAt: now,
      updatedBy: actor.uid,
      adminModeration: {
        note: noteValue || null,
        updatedBy: actor.uid,
        updatedAt: now,
      },
    },
    { merge: true }
  );

  const auditRef = db.collection("auditEvents").doc();
  await auditRef.set({
    eventId: auditRef.id,
    action: auditAction,
    actorUid: actor.uid,
    actorRole: "admin",
    resourceType: "review",
    resourceId: reviewId,
    statusFrom: currentStatus || null,
    statusTo: statusTo || null,
    result: "success",
    context: {
      bookingId: readString(current.bookingId) || reviewId,
      providerId: readString(current.providerId) || null,
      authorUserId: readString(current.authorUserId) || null,
      note: noteValue || null,
    },
    createdAt: now,
  });

  const updatedSnap = await reviewRef.get();
  const updated = (updatedSnap.data() || {}) as Record<string, unknown>;
  const bookingId = readString(updated.bookingId) || reviewId;
  const userId = readString(updated.authorUserId);
  const providerId = readString(updated.providerId);
  const [bookingSnap, userSnap, providerSnap] = await Promise.all([
    bookingId ? db.collection("bookings").doc(bookingId).get() : Promise.resolve(null),
    userId ? db.collection("users").doc(userId).get() : Promise.resolve(null),
    providerId ? db.collection("providers").doc(providerId).get() : Promise.resolve(null),
  ]);

  return toReviewItem(
    {
      reviewId,
      ...updated,
    },
    bookingSnap && bookingSnap.exists ? (bookingSnap.data() as Record<string, unknown>) : null,
    userSnap && userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null,
    providerSnap && providerSnap.exists
      ? (providerSnap.data() as Record<string, unknown>)
      : null
  );
}

export async function deleteAdminReview(
  reviewIdInput: string,
  actor: { uid: string }
): Promise<{ reviewId: string }> {
  const reviewId = readString(reviewIdInput);
  if (!reviewId) {
    throw new AdminReviewError("Review id este obligatoriu.", 400);
  }

  const db = getAdminDb();
  const reviewRef = db.collection("reviews").doc(reviewId);
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) {
    throw new AdminReviewError("Review-ul nu există.", 404);
  }

  const current = (reviewSnap.data() || {}) as Record<string, unknown>;
  const now = Timestamp.now();
  const auditRef = db.collection("auditEvents").doc();
  await auditRef.set({
    eventId: auditRef.id,
    action: "review.delete.hard",
    actorUid: actor.uid,
    actorRole: "admin",
    resourceType: "review",
    resourceId: reviewId,
    statusFrom: readString(current.status) || null,
    statusTo: "deleted",
    result: "success",
    context: {
      bookingId: readString(current.bookingId) || reviewId,
      providerId: readString(current.providerId) || null,
      authorUserId: readString(current.authorUserId) || null,
    },
    createdAt: now,
  });

  await reviewRef.delete();
  return { reviewId };
}

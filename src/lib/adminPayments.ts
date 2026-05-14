import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export type PaymentWebhookState = "ok" | "delayed" | "missing";

export type PaymentAdminListItem = {
  paymentId: string;
  bookingId: string | null;
  userId: string | null;
  providerId: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  amount: number;
  currency: string;
  processor: string;
  method: string;
  last4: string | null;
  transactionId: string | null;
  stripePaymentIntentId: string | null;
  stripeLatestChargeId: string | null;
  stripeStatus: string | null;
  webhookEventId: string | null;
  webhookState: PaymentWebhookState;
  booking: {
    bookingId: string | null;
    status: string | null;
    scheduledStartAt: string | null;
    userName: string | null;
    providerName: string | null;
    serviceName: string | null;
  };
  user: {
    userId: string | null;
    displayName: string | null;
    email: string | null;
  };
  provider: {
    providerId: string | null;
    displayName: string | null;
    email: string | null;
  };
};

export type PaymentListFilters = {
  status?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  providerId?: string;
  userId?: string;
  processorId?: string;
  q?: string;
};

export type PaymentQueryResult = {
  items: PaymentAdminListItem[];
  total: number;
  truncated: boolean;
  maxRows: number;
};

const WEBHOOK_DELAY_MS = 15 * 60 * 1000;
const WEBHOOK_MISSING_MS = 24 * 60 * 60 * 1000;

function readString(value: unknown) {
  return String(value || "").trim();
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
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: unknown) {
  return readString(value).toLowerCase();
}

function resolveWebhookState(
  payment: Record<string, unknown>,
  nowMs: number
): PaymentWebhookState {
  const processor = normalizeText(payment.processor);
  const status = normalizeText(payment.status);
  const webhookEventId = readString(payment.webhookEventId);
  const createdAtMs = toMillis(payment.createdAt);

  if (
    processor !== "stripe"
    || status !== "in_progress"
    || webhookEventId
    || createdAtMs <= 0
  ) {
    return "ok";
  }

  const age = nowMs - createdAtMs;
  if (age > WEBHOOK_MISSING_MS) {
    return "missing";
  }
  if (age > WEBHOOK_DELAY_MS) {
    return "delayed";
  }
  return "ok";
}

function matchesProcessorId(payment: PaymentAdminListItem, processorId: string) {
  if (!processorId) {
    return true;
  }
  const token = processorId.toLowerCase();
  return [
    payment.transactionId,
    payment.stripePaymentIntentId,
    payment.stripeLatestChargeId,
    payment.paymentId,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

function matchesSearch(payment: PaymentAdminListItem, query: string) {
  if (!query) {
    return true;
  }
  const token = query.toLowerCase();
  return [
    payment.paymentId,
    payment.bookingId,
    payment.user.displayName,
    payment.user.email,
    payment.provider.displayName,
    payment.provider.email,
    payment.booking.userName,
    payment.booking.providerName,
    payment.booking.serviceName,
    payment.transactionId,
    payment.stripePaymentIntentId,
    payment.stripeLatestChargeId,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

async function loadByIds(collectionName: string, ids: string[]) {
  if (!ids.length) {
    return new Map<string, Record<string, unknown>>();
  }
  const db = getAdminDb();
  const snapshots: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[] =
    await Promise.all(
    ids.map((id) => db.collection(collectionName).doc(id).get())
  );
  const result = new Map<string, Record<string, unknown>>();
  snapshots.forEach((snapshot) => {
    if (snapshot.exists) {
      result.set(snapshot.id, (snapshot.data() || {}) as Record<string, unknown>);
    }
  });
  return result;
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

function sortByCreatedAtDesc(items: PaymentAdminListItem[]) {
  return [...items].sort(
    (first, second) => toMillis(second.createdAt) - toMillis(first.createdAt)
  );
}

export async function listAdminPayments(
  filters: PaymentListFilters,
  options?: { maxRows?: number; now?: Date }
): Promise<PaymentQueryResult> {
  const db = getAdminDb();
  const maxRows = Math.max(1, Math.floor(options?.maxRows || 5000));
  const nowMs = (options?.now || new Date()).getTime();

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    db.collection("payments");

  const status = readString(filters.status);
  const providerId = readString(filters.providerId);
  const userId = readString(filters.userId);

  if (status) {
    query = query.where("status", "==", status);
  }
  if (providerId) {
    query = query.where("providerId", "==", providerId);
  }
  if (userId) {
    query = query.where("userId", "==", userId);
  }
  if (filters.dateFrom instanceof Date) {
    query = query.where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom));
  }
  if (filters.dateTo instanceof Date) {
    query = query.where("createdAt", "<=", Timestamp.fromDate(filters.dateTo));
  }

  const snapshot = await query.orderBy("createdAt", "desc").limit(maxRows + 1).get();
  const truncated = snapshot.docs.length > maxRows;
  const paymentDocs = truncated ? snapshot.docs.slice(0, maxRows) : snapshot.docs;
  const paymentItems: Array<Record<string, unknown> & { paymentId: string }> =
    paymentDocs.map((doc) => ({ paymentId: doc.id, ...doc.data() }));

  const bookingIds = readUniqueIds(paymentItems, "bookingId");
  const userIds = readUniqueIds(paymentItems, "userId");
  const providerIds = readUniqueIds(paymentItems, "providerId");

  const [bookingsById, usersById, providersById] = await Promise.all([
    loadByIds("bookings", bookingIds),
    loadByIds("users", userIds),
    loadByIds("providers", providerIds),
  ]);

  const mapped = paymentItems.map((payment) => {
    const bookingId = readString(payment.bookingId) || null;
    const userIdValue = readString(payment.userId) || null;
    const providerIdValue = readString(payment.providerId) || null;
    const booking = bookingId ? bookingsById.get(bookingId) || null : null;
    const user = userIdValue ? usersById.get(userIdValue) || null : null;
    const provider = providerIdValue ? providersById.get(providerIdValue) || null : null;

    const normalized: PaymentAdminListItem = {
      paymentId: readString(payment.paymentId),
      bookingId,
      userId: userIdValue,
      providerId: providerIdValue,
      status: readString(payment.status) || "unknown",
      createdAt: toIso(payment.createdAt),
      updatedAt: toIso(payment.updatedAt),
      amount: toNumber(payment.amount),
      currency: readString(payment.currency) || "RON",
      processor: readString(payment.processor) || "unknown",
      method: readString(payment.method),
      last4: readString(payment.last4) || null,
      transactionId: readString(payment.transactionId) || null,
      stripePaymentIntentId: readString(payment.stripePaymentIntentId) || null,
      stripeLatestChargeId: readString(payment.stripeLatestChargeId) || null,
      stripeStatus: readString(payment.stripeStatus) || null,
      webhookEventId: readString(payment.webhookEventId) || null,
      webhookState: resolveWebhookState(payment, nowMs),
      booking: {
        bookingId,
        status: readString(booking?.status) || null,
        scheduledStartAt: toIso(booking?.scheduledStartAt),
        userName: readString((booking?.userSnapshot as Record<string, unknown> | undefined)?.displayName) || null,
        providerName: readString((booking?.providerSnapshot as Record<string, unknown> | undefined)?.displayName) || null,
        serviceName: readString((booking?.serviceSnapshot as Record<string, unknown> | undefined)?.name) || null,
      },
      user: {
        userId: userIdValue,
        displayName: readString(user?.displayName) || null,
        email: readString(user?.email) || null,
      },
      provider: {
        providerId: providerIdValue,
        displayName:
          readString(
            (
              provider?.professionalProfile as
                | Record<string, unknown>
                | undefined
            )?.displayName
          ) || null,
        email: readString(provider?.email) || null,
      },
    };

    return normalized;
  });

  const processorId = normalizeText(filters.processorId);
  const search = normalizeText(filters.q);
  const filtered = mapped.filter(
    (item) => matchesProcessorId(item, processorId) && matchesSearch(item, search)
  );

  return {
    items: sortByCreatedAtDesc(filtered),
    total: filtered.length,
    truncated,
    maxRows,
  };
}

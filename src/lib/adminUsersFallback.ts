import { getAdminDb } from "@/lib/firebaseAdmin";

type UserDoc = Record<string, any>;
type BookingDoc = Record<string, any>;
type AuditDoc = Record<string, any>;

function sanitizeString(value: unknown) {
  return String(value || "").trim();
}

function normalizeLimit(value: unknown, fallback = 50, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
}

function getTimestampMillis(value: unknown) {
  if (!value) {
    return 0;
  }

  if (typeof (value as { toMillis?: () => number })?.toMillis === "function") {
    return Number((value as { toMillis: () => number }).toMillis()) || 0;
  }

  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function serializeTimestamp(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function serializeValue(value: unknown): unknown {
  if (
    value == null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
  ) {
    return value;
  }

  const serializedTimestamp = serializeTimestamp(value);
  if (serializedTimestamp) {
    return serializedTimestamp;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        serializeValue(nested),
      ])
    );
  }

  return value;
}

function matchesSearch(haystack: Array<unknown>, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }
  return haystack.some((value) => String(value || "").toLowerCase().includes(searchTerm));
}

function sortByTimestampDesc<T>(items: T[], resolver: (item: T) => unknown) {
  return [...items].sort(
    (firstItem, secondItem) =>
      getTimestampMillis(resolver(secondItem)) - getTimestampMillis(resolver(firstItem))
  );
}

function getLegalConsentState(data: UserDoc) {
  const hasTermsConsent = Boolean(data.termsAcceptedAt || data.termsVersion);
  const hasPrivacyConsent = Boolean(data.privacyAcceptedAt || data.privacyVersion);

  if (hasTermsConsent && hasPrivacyConsent) {
    return "accepted";
  }
  if (hasTermsConsent || hasPrivacyConsent) {
    return "partial";
  }
  return "missing";
}

function buildUserListItem(userId: string, user: UserDoc) {
  const primaryLocation = user.primaryLocation || {};
  return serializeValue({
    userId,
    role: sanitizeString(user.role) || "user",
    accountStatus: sanitizeString(user.accountStatus),
    displayName: sanitizeString(user.displayName),
    email: sanitizeString(user.email) || null,
    phoneNumber: sanitizeString(user.phoneNumber) || null,
    locale: sanitizeString(user.locale) || null,
    primaryLocationLabel: sanitizeString(primaryLocation.formattedAddress),
    authProviders: Array.isArray(user.authProviders)
      ? user.authProviders.map((item: unknown) => sanitizeString(item)).filter(Boolean)
      : [],
    legalConsentState: getLegalConsentState(user),
    termsAcceptedAt: user.termsAcceptedAt || null,
    termsVersion: sanitizeString(user.termsVersion) || null,
    privacyAcceptedAt: user.privacyAcceptedAt || null,
    privacyVersion: sanitizeString(user.privacyVersion) || null,
    legalConsentSource: sanitizeString(user.legalConsentSource) || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    lastLoginAt: user.lastLoginAt || null,
  });
}

function buildBookingListItem(bookingId: string, booking: BookingDoc) {
  const pricingSnapshot = booking.pricingSnapshot || {};
  const requestDetails = booking.requestDetails || {};
  const requestResponse = booking.requestResponse || {};
  const professionalsCount = Math.max(
    1,
    Number(requestDetails.professionalsCount || pricingSnapshot.professionalsCount || 1),
  );
  const estimatedHours = Math.max(
    1,
    Number(requestDetails.estimatedHours || pricingSnapshot.estimatedHours || 1),
  );
  const ratePerHourPerProfessional = Number(
    pricingSnapshot.ratePerHourPerProfessional
    ?? booking.serviceSnapshot?.baseRateAmount
  ) || 0;
  return serializeValue({
    bookingId,
    status: sanitizeString(booking.status),
    userId: sanitizeString(booking.userId),
    providerId: sanitizeString(booking.providerId),
    serviceId: sanitizeString(booking.serviceId),
    scheduledStartAt: booking.scheduledStartAt || null,
    scheduledEndAt: booking.scheduledEndAt || null,
    timezone: sanitizeString(booking.timezone),
    requestDetails: {
      description: sanitizeString(requestDetails.description),
      estimatedHours,
      professionalsCount,
    },
    requestResponse: {
      status: sanitizeString(requestResponse.status) || null,
      profile: sanitizeString(requestResponse.profile) || null,
      minNoticeMinutes: Number(requestResponse.minNoticeMinutes) || null,
      windowMinutes: Number(requestResponse.windowMinutes) || null,
      leadTimeMinutesAtCreate: Number(requestResponse.leadTimeMinutesAtCreate) || null,
      deadlineAt: requestResponse.deadlineAt || null,
      answeredAt: requestResponse.answeredAt || null,
      expiredAt: requestResponse.expiredAt || null,
    },
    pricingSnapshot,
    paymentSummary: {
      ...(booking.paymentSummary || {}),
      amount: Number(pricingSnapshot.amount) || 0,
      currency: sanitizeString(pricingSnapshot.currency) || "RON",
      professionalsCount,
      estimatedHours,
      ratePerHourPerProfessional,
    },
    userSnapshot: booking.userSnapshot || null,
    providerSnapshot: booking.providerSnapshot || null,
    serviceSnapshot: booking.serviceSnapshot || null,
    createdAt: booking.createdAt || null,
    updatedAt: booking.updatedAt || null,
  });
}

function buildAuditEventItem(eventId: string, event: AuditDoc) {
  return serializeValue({
    eventId,
    action: sanitizeString(event.action),
    actorUid: sanitizeString(event.actorUid) || null,
    actorRole: sanitizeString(event.actorRole) || null,
    resourceType: sanitizeString(event.resourceType),
    resourceId: sanitizeString(event.resourceId),
    result: sanitizeString(event.result),
    reasonCode: sanitizeString(event.reasonCode) || null,
    metadata: event.metadata || {},
    context: event.context || {},
    createdAt: event.createdAt || null,
  });
}

async function fetchCollectionDocs(collectionName: string) {
  const db = getAdminDb();
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    data: docSnap.data() || {},
  }));
}

export async function listAdminUsersFallback(params: { limit?: number; search?: string }) {
  const search = sanitizeString(params.search).toLowerCase();
  const limit = normalizeLimit(params.limit, 50, 100);
  const users = await fetchCollectionDocs("users");

  const filtered = sortByTimestampDesc(
    users.filter((item) =>
      matchesSearch(
        [
          item.id,
          item.data.displayName,
          item.data.email,
          item.data.phoneNumber,
          item.data.primaryLocation?.formattedAddress,
        ],
        search
      )
    ),
    (item) => item.data.updatedAt || item.data.createdAt || item.data.lastLoginAt
  );

  return {
    total: filtered.length,
    items: filtered.slice(0, limit).map((item) => buildUserListItem(item.id, item.data)),
  };
}

export async function getAdminUserCaseFallback(userIdInput: string) {
  const userId = sanitizeString(userIdInput);
  if (!userId) {
    const error = new Error("User id is required.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const db = getAdminDb();
  const [userSnap, bookings, auditEvents] = await Promise.all([
    db.collection("users").doc(userId).get(),
    fetchCollectionDocs("bookings"),
    fetchCollectionDocs("auditEvents"),
  ]);

  if (!userSnap.exists) {
    const error = new Error("User profile not found.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const user = userSnap.data() || {};
  const relatedBookings = sortByTimestampDesc(
    bookings.filter((item) => sanitizeString(item.data.userId) === userId),
    (item) => item.data.updatedAt || item.data.createdAt
  ).slice(0, 10);

  const relatedAuditEvents = sortByTimestampDesc(
    auditEvents.filter((event) => {
      const resourceId = sanitizeString(event.data.resourceId);
      const actorUid = sanitizeString(event.data.actorUid);
      const contextUserId = sanitizeString(event.data.context?.userId);

      return (
        resourceId === userId
        || resourceId.startsWith(`${userId}:`)
        || resourceId.startsWith(`${userId}/`)
        || actorUid === userId
        || contextUserId === userId
      );
    }),
    (item) => item.data.createdAt
  ).slice(0, 25);

  return {
    user: serializeValue({
      userId,
      ...user,
      legalConsentState: getLegalConsentState(user),
    }),
    recentBookings: relatedBookings.map((item) => buildBookingListItem(item.id, item.data)),
    recentAuditEvents: relatedAuditEvents.map((item) => buildAuditEventItem(item.id, item.data)),
  };
}

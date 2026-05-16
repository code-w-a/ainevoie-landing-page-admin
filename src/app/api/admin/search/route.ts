import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

type SearchEntityType =
  | "users"
  | "providers"
  | "bookings"
  | "payments"
  | "support"
  | "conversations";

type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  meta?: string | null;
};

type SearchGroup = {
  type: SearchEntityType;
  label: string;
  items: SearchResultItem[];
};

const SEARCH_ROUTE = "api/admin/search/route.ts";
const SCAN_LIMIT = 80;
const GROUP_LIMIT = 6;

function readString(value: unknown) {
  return String(value || "").trim();
}

function normalizeSearch(value: unknown) {
  return readString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesQuery(query: string, values: unknown[]) {
  const token = normalizeSearch(query);
  if (!token) {
    return false;
  }
  return values.map(normalizeSearch).some((value) => value.includes(token));
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function profileDisplayName(source: Record<string, unknown>) {
  const professionalProfile = (source.professionalProfile as Record<string, unknown> | undefined) || {};
  return (
    readString(professionalProfile.displayName)
    || readString(professionalProfile.businessName)
    || readString(source.displayName)
    || readString(source.businessName)
  );
}

function humanUserLabel(source: Record<string, unknown>) {
  return readString(source.displayName) || readString(source.email) || readString(source.phoneNumber);
}

function humanProviderLabel(source: Record<string, unknown>) {
  return profileDisplayName(source) || readString(source.email) || readString(source.phoneNumber);
}

function uniqueById(items: SearchResultItem[]) {
  const seen = new Set<string>();
  const result: SearchResultItem[] = [];
  items.forEach((item) => {
    if (seen.has(item.id)) {
      return;
    }
    seen.add(item.id);
    result.push(item);
  });
  return result.slice(0, GROUP_LIMIT);
}

async function readDirectDoc(collectionName: string, id: string) {
  if (!id) {
    return null;
  }
  const db = getAdminDb();
  const snap = await db.collection(collectionName).doc(id).get();
  if (!snap.exists) {
    return null;
  }
  return {
    id: snap.id,
    data: (snap.data() || {}) as Record<string, unknown>,
  };
}

async function scanCollection(collectionName: string, orderByField = "updatedAt") {
  const db = getAdminDb();
  try {
    const snapshot = await db
      .collection(collectionName)
      .orderBy(orderByField, "desc")
      .limit(SCAN_LIMIT)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: (doc.data() || {}) as Record<string, unknown>,
    }));
  } catch {
    const snapshot = await db.collection(collectionName).limit(SCAN_LIMIT).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: (doc.data() || {}) as Record<string, unknown>,
    }));
  }
}

async function searchUsers(query: string): Promise<SearchGroup> {
  const [direct, scanned] = await Promise.all([
    readDirectDoc("users", query).catch(() => null),
    scanCollection("users", "createdAt").catch(() => []),
  ]);
  const docs = direct ? [direct, ...scanned] : scanned;
  const items = docs
    .filter(({ id, data }) =>
      matchesQuery(query, [
        id,
        data.uid,
        data.displayName,
        data.email,
        data.phoneNumber,
        data.phone,
      ])
    )
    .map(({ id, data }) => ({
      id,
      title: readString(data.displayName) || readString(data.email) || id,
      subtitle: readString(data.email) || readString(data.phoneNumber) || null,
      href: `/admin/utilizatori/${encode(id)}`,
      meta: readString(data.role) || "user",
    }));

  return { type: "users", label: "Utilizatori", items: uniqueById(items) };
}

async function searchProviders(query: string): Promise<SearchGroup> {
  const [direct, scanned] = await Promise.all([
    readDirectDoc("providers", query).catch(() => null),
    scanCollection("providers", "updatedAt").catch(() => []),
  ]);
  const docs = direct ? [direct, ...scanned] : scanned;
  const items = docs
    .filter(({ id, data }) => {
      const profile = (data.professionalProfile as Record<string, unknown> | undefined) || {};
      return matchesQuery(query, [
        id,
        data.uid,
        data.email,
        data.phoneNumber,
        data.phone,
        profile.displayName,
        profile.businessName,
        profile.specialization,
      ]);
    })
    .map(({ id, data }) => ({
      id,
      title: profileDisplayName(data) || readString(data.email) || id,
      subtitle: readString(data.email) || readString(data.phoneNumber) || null,
      href: `/admin/prestatori/${encode(id)}`,
      meta: readString(data.status) || "provider",
    }));

  return { type: "providers", label: "Prestatori", items: uniqueById(items) };
}

async function searchBookings(query: string): Promise<SearchGroup> {
  const [direct, scanned] = await Promise.all([
    readDirectDoc("bookings", query).catch(() => null),
    scanCollection("bookings", "updatedAt").catch(() => []),
  ]);
  const docs = direct ? [direct, ...scanned] : scanned;
  const items = docs
    .filter(({ id, data }) => {
      const userSnapshot = (data.userSnapshot as Record<string, unknown> | undefined) || {};
      const providerSnapshot = (data.providerSnapshot as Record<string, unknown> | undefined) || {};
      const serviceSnapshot = (data.serviceSnapshot as Record<string, unknown> | undefined) || {};
      return matchesQuery(query, [
        id,
        data.bookingId,
        data.userId,
        data.providerId,
        userSnapshot.displayName,
        providerSnapshot.displayName,
        serviceSnapshot.name,
        data.paymentId,
      ]);
    })
    .map(({ id, data }) => ({
      id,
      title:
        [
          readString((data.userSnapshot as Record<string, unknown> | undefined)?.displayName),
          readString((data.providerSnapshot as Record<string, unknown> | undefined)?.displayName),
        ].filter(Boolean).join(" → ")
        || readString((data.serviceSnapshot as Record<string, unknown> | undefined)?.name)
        || "Programare",
      subtitle: [
        readString(data.status),
        readString((data.serviceSnapshot as Record<string, unknown> | undefined)?.name),
      ].filter(Boolean).join(" · ") || null,
      href: `/admin/programari/${encode(id)}`,
      meta: id,
    }));

  return { type: "bookings", label: "Programări", items: uniqueById(items) };
}

async function searchPayments(query: string): Promise<SearchGroup> {
  const [direct, scanned] = await Promise.all([
    readDirectDoc("payments", query).catch(() => null),
    scanCollection("payments", "createdAt").catch(() => []),
  ]);
  const docs = direct ? [direct, ...scanned] : scanned;
  const items = docs
    .filter(({ id, data }) =>
      matchesQuery(query, [
        id,
        data.paymentId,
        data.transactionId,
        data.bookingId,
        data.userId,
        data.providerId,
        data.stripePaymentIntentId,
        data.stripeLatestChargeId,
      ])
    )
    .map(({ id, data }) => ({
      id,
      title: `Plată ${readString(data.paymentId) || id}`,
      subtitle: [
        readString(data.status),
        readString(data.bookingId) ? `booking ${readString(data.bookingId)}` : "",
      ].filter(Boolean).join(" · ") || null,
      href: readString(data.bookingId)
        ? `/admin/programari/${encode(readString(data.bookingId))}`
        : `/admin/plati?q=${encode(id)}`,
      meta: readString(data.processor) || readString(data.method) || null,
    }));

  return { type: "payments", label: "Plăți", items: uniqueById(items) };
}

async function searchSupportTickets(query: string): Promise<SearchGroup> {
  const [direct, scanned] = await Promise.all([
    readDirectDoc("supportTickets", query).catch(() => null),
    scanCollection("supportTickets", "updatedAt").catch(() => []),
  ]);
  const docs = direct ? [direct, ...scanned] : scanned;
  const items = docs
    .filter(({ id, data }) => {
      const related = (data.relatedEntity as Record<string, unknown> | undefined) || {};
      const requester = (data.requesterSnapshot as Record<string, unknown> | undefined) || {};
      return matchesQuery(query, [
        id,
        data.ticketId,
        data.subject,
        data.initialMessage,
        data.requesterUid,
        requester.email,
        requester.phoneNumber,
        related.bookingId,
        related.userId,
        related.providerId,
      ]);
    })
    .map(({ id, data }) => ({
      id,
      title: readString(data.subject) || `Ticket ${id}`,
      subtitle: [
        readString(data.status),
        readString(data.priority),
      ].filter(Boolean).join(" · ") || null,
      href: `/admin/suport?q=${encode(id)}`,
      meta:
        humanUserLabel((data.requesterSnapshot as Record<string, unknown> | undefined) || {})
        || humanProviderLabel((data.requesterSnapshot as Record<string, unknown> | undefined) || {})
        || readString(data.requesterUid)
        || null,
    }));

  return { type: "support", label: "Suport", items: uniqueById(items) };
}

async function searchConversations(query: string): Promise<SearchGroup> {
  const conversationId = query.startsWith("conv_")
    ? query
    : query.startsWith("bk_")
      ? `conv_bk_${query}`
      : query;
  const [direct, scanned] = await Promise.all([
    readDirectDoc("conversations", conversationId).catch(() => null),
    scanCollection("conversations", "updatedAt").catch(() => []),
  ]);
  const docs = direct ? [direct, ...scanned] : scanned;
  const items = docs
    .filter(({ id, data }) =>
      matchesQuery(query, [
        id,
        data.conversationId,
        data.bookingId,
        data.userId,
        data.providerId,
        ...(Array.isArray(data.participantIds) ? data.participantIds : []),
      ])
    )
    .map(({ id, data }) => ({
      id,
      title:
        [
          readString((data.userSnapshot as Record<string, unknown> | undefined)?.displayName),
          readString((data.providerSnapshot as Record<string, unknown> | undefined)?.displayName),
        ].filter(Boolean).join(" → ")
        || (readString(data.bookingId) ? "Conversație booking" : "Conversație"),
      subtitle: [
        readString(data.type),
        readString(data.status),
        readString(data.bookingId) ? `booking ${readString(data.bookingId)}` : "",
      ].filter(Boolean).join(" · ") || null,
      href: `/admin/conversatii?conversationId=${encode(id)}`,
      meta: id,
    }));

  return { type: "conversations", label: "Conversații", items: uniqueById(items) };
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const query = readString(searchParams.get("q")).slice(0, 120);

    if (query.length < 2) {
      return NextResponse.json({ query, groups: [], total: 0 });
    }

    console.info("[admin-search] request", {
      adminUid: admin.uid,
      queryLength: query.length,
    });

    const groups = await Promise.all([
      searchUsers(query),
      searchProviders(query),
      searchBookings(query),
      searchPayments(query),
      searchSupportTickets(query),
      searchConversations(query),
    ]);
    const visibleGroups = groups.filter((group) => group.items.length > 0);
    const total = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);

    return NextResponse.json({
      query,
      groups: visibleGroups,
      total,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    console.error("[admin-search] route error", error);
    captureServerException(error, { route: SEARCH_ROUTE });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut executa căutarea." },
      { status: 500 }
    );
  }
}

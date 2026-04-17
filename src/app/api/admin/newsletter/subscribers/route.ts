import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import {
  NEWSLETTER_SUBSCRIBER_STATUSES,
  type NewsletterSubscriberStatus,
} from "@/types/newsletter";
import { sanitizePayload } from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

const ALLOWED_SORTS: Record<string, string> = {
  createdAt: "createdAt",
  email: "email",
  status: "status",
};

const ALLOWED_STATUS_SET = new Set<string>(NEWSLETTER_SUBSCRIBER_STATUSES);
const CONSENT_METHOD = "single_opt_in";

function parseCursor(cursor: string, field: string) {
  if (field === "createdAt") {
    const parsed = new Date(cursor);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return cursor;
}

function serializeCursor(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as FirebaseFirestore.Timestamp).toDate().toISOString();
  }
  return value ?? null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseDateValue(value: unknown): Date | null | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .filter((tag) => typeof tag === "string")
        .map((tag: string) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function isSubscriberStatus(value: unknown): value is NewsletterSubscriberStatus {
  return typeof value === "string" && ALLOWED_STATUS_SET.has(value);
}

function buildStatusMetadataUpdates(
  status: NewsletterSubscriberStatus,
  existing: FirebaseFirestore.DocumentData | null,
  statusReason?: string | null
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (typeof statusReason !== "undefined") {
    updates.statusReason = statusReason;
  }

  if (status === "bounced") {
    updates.bouncedAt = existing?.bouncedAt || FieldValue.serverTimestamp();
  } else {
    updates.bouncedAt = null;
  }

  if (status === "complaint") {
    updates.complaintAt = existing?.complaintAt || FieldValue.serverTimestamp();
  } else {
    updates.complaintAt = null;
  }

  if (status === "suppressed") {
    updates.suppressedAt = existing?.suppressedAt || FieldValue.serverTimestamp();
  } else {
    updates.suppressedAt = null;
  }

  return updates;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 100);
    const cursor = searchParams.get("cursor");
    const status = searchParams.get("status");
    const sortByKey = searchParams.get("sortBy") || "createdAt";
    const sortField = ALLOWED_SORTS[sortByKey] || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection("newsletter_subscribers")
      .orderBy(sortField, sortDir)
      .limit(limit);

    if (status && status !== "all") {
      if (!isSubscriberStatus(status)) {
        return NextResponse.json(
          { error: "Statusul abonatului este invalid." },
          { status: 400 }
        );
      }
      query = query.where("status", "==", status);
    }

    if (cursor) {
      const parsedCursor = parseCursor(cursor, sortField);
      if (parsedCursor !== null) {
        query = query.startAfter(parsedCursor);
      }
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map(serializeDoc).filter(Boolean);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? serializeCursor(lastDoc.get(sortField)) : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    captureServerException(error, { route: "api/admin/newsletter/subscribers/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca abonații." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const normalizedEmail = readString(body.email).toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Adresa de email este invalidă." },
        { status: 400 }
      );
    }

    const requestedStatus = readString(body.status);
    const status = (requestedStatus || "active") as NewsletterSubscriberStatus;
    if (!isSubscriberStatus(status)) {
      return NextResponse.json(
        { error: "Statusul abonatului este invalid." },
        { status: 400 }
      );
    }

    const consentMethod =
      readString(body.consentMethod) || CONSENT_METHOD;
    if (consentMethod !== CONSENT_METHOD) {
      return NextResponse.json(
        { error: "Metoda de consimțământ trebuie să fie single_opt_in." },
        { status: 400 }
      );
    }

    const consentGranted =
      typeof body.consentGranted === "boolean" ? body.consentGranted : true;
    const parsedCapturedAt = parseDateValue(body.consentCapturedAt);
    const parsedWithdrawnAt = parseDateValue(body.consentWithdrawnAt);
    const statusReasonRaw = readString(body.statusReason);
    const statusReason = statusReasonRaw ? statusReasonRaw.slice(0, 500) : null;
    const tags = parseTags(body.tags);
    const source = readString(body.source) || "admin_manual";
    const consentSource = readString(body.consentSource) || "admin_manual";
    const consentTextVersion = readString(body.consentTextVersion) || "v1";

    const db = getAdminDb();
    let existingSnap = await db
      .collection("newsletter_subscribers")
      .where("emailNormalized", "==", normalizedEmail)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      existingSnap = await db
        .collection("newsletter_subscribers")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();
    }

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data() || {};
      const existingStatus = String(existingData.status || "").toLowerCase();

      if (existingStatus === "unsubscribed" && status === "active") {
        return NextResponse.json(
          {
            error:
              "Această adresă este dezabonată. Nu o poți reactiva din admin; utilizatorul trebuie să se înscrie din nou cu acord explicit (GDPR).",
          },
          { status: 409 }
        );
      }

      const metadataUpdates = buildStatusMetadataUpdates(
        status,
        existingData,
        statusReason
      );

      const updates = sanitizePayload({
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        status,
        tags,
        source,
        consentGranted: status === "unsubscribed" ? false : consentGranted,
        consentSource,
        consentTextVersion,
        consentMethod: CONSENT_METHOD,
        consentCapturedAt:
          status === "unsubscribed" ?
            null :
            parsedCapturedAt ??
              existingData.consentCapturedAt ??
              (consentGranted ? FieldValue.serverTimestamp() : null),
        consentWithdrawnAt:
          status === "unsubscribed" || consentGranted === false ?
            parsedWithdrawnAt ??
              existingData.consentWithdrawnAt ??
              FieldValue.serverTimestamp() :
            null,
        ...metadataUpdates,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await existingDoc.ref.update(updates);
      return NextResponse.json({ id: existingDoc.id, status: "already_exists" });
    }

    const metadataUpdates = buildStatusMetadataUpdates(status, null, statusReason);
    const newDoc = sanitizePayload({
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      status,
      tags,
      source,
      consentGranted: status === "unsubscribed" ? false : consentGranted,
      consentCapturedAt:
        status === "unsubscribed" ?
          null :
          parsedCapturedAt ??
            (consentGranted ? FieldValue.serverTimestamp() : null),
      consentSource,
      consentTextVersion,
      consentMethod: CONSENT_METHOD,
      consentWithdrawnAt:
        status === "unsubscribed" || consentGranted === false ?
          parsedWithdrawnAt ?? FieldValue.serverTimestamp() :
          null,
      ...metadataUpdates,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const docRef = await db.collection("newsletter_subscribers").add(newDoc);
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    captureServerException(error, { route: "api/admin/newsletter/subscribers/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut crea abonatul." },
      { status: 500 }
    );
  }
}

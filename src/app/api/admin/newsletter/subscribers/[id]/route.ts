import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import {
  NEWSLETTER_SUBSCRIBER_STATUSES,
  type NewsletterSubscriberStatus,
} from "@/types/newsletter";
import { sanitizePayload } from "@/lib/newsletterAdmin";

const ALLOWED_STATUS_SET = new Set<string>(NEWSLETTER_SUBSCRIBER_STATUSES);
const CONSENT_METHOD = "single_opt_in";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
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

function isSubscriberStatus(value: unknown): value is NewsletterSubscriberStatus {
  return typeof value === "string" && ALLOWED_STATUS_SET.has(value);
}

function buildStatusMetadataUpdates(
  status: NewsletterSubscriberStatus,
  existing: FirebaseFirestore.DocumentData
): Record<string, unknown> {
  return {
    bouncedAt: status === "bounced" ?
      existing.bouncedAt || FieldValue.serverTimestamp() :
      null,
    complaintAt: status === "complaint" ?
      existing.complaintAt || FieldValue.serverTimestamp() :
      null,
    suppressedAt: status === "suppressed" ?
      existing.suppressedAt || FieldValue.serverTimestamp() :
      null,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();
    const docRef = db.collection("newsletter_subscribers").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Abonatul nu există." },
        { status: 404 }
      );
    }

    const existingData = docSnap.data() || {};
    const updates: Record<string, unknown> = {};

    if (typeof body.email !== "undefined") {
      const normalizedEmail = readString(body.email).toLowerCase();
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        return NextResponse.json(
          { error: "Adresa de email este invalidă." },
          { status: 400 }
        );
      }
      updates.email = normalizedEmail;
      updates.emailNormalized = normalizedEmail;
    }

    if (typeof body.tags !== "undefined") {
      updates.tags = parseTags(body.tags) || [];
    }

    const statusInput = readString(body.status);
    const hasStatus = Boolean(statusInput);
    if (hasStatus && !isSubscriberStatus(statusInput)) {
      return NextResponse.json(
        { error: "Statusul abonatului este invalid." },
        { status: 400 }
      );
    }
    const status = (hasStatus ?
      statusInput :
      existingData.status || "active") as NewsletterSubscriberStatus;
    if (hasStatus) {
      updates.status = status;
      Object.assign(updates, buildStatusMetadataUpdates(status, existingData));
    }

    if (typeof body.statusReason !== "undefined") {
      const reason = readString(body.statusReason);
      updates.statusReason = reason ? reason.slice(0, 500) : null;
    }

    const consentMethod = readString(body.consentMethod);
    if (consentMethod && consentMethod !== CONSENT_METHOD) {
      return NextResponse.json(
        { error: "Metoda de consimțământ trebuie să fie single_opt_in." },
        { status: 400 }
      );
    }
    if (consentMethod) {
      updates.consentMethod = CONSENT_METHOD;
    }

    const hasConsentGranted = typeof body.consentGranted === "boolean";
    const consentGranted = hasConsentGranted ?
      Boolean(body.consentGranted) :
      Boolean(existingData.consentGranted ?? true);

    if (hasConsentGranted) {
      updates.consentGranted = consentGranted;
    }

    const consentSource = readString(body.consentSource);
    if (consentSource) {
      updates.consentSource = consentSource;
    }

    const consentTextVersion = readString(body.consentTextVersion);
    if (consentTextVersion) {
      updates.consentTextVersion = consentTextVersion;
    }

    const parsedCapturedAt = parseDateValue(body.consentCapturedAt);
    if (typeof parsedCapturedAt !== "undefined") {
      updates.consentCapturedAt = parsedCapturedAt;
    }

    const parsedWithdrawnAt = parseDateValue(body.consentWithdrawnAt);
    if (typeof parsedWithdrawnAt !== "undefined") {
      updates.consentWithdrawnAt = parsedWithdrawnAt;
    }

    if (status === "unsubscribed") {
      updates.consentGranted = false;
      if (typeof updates.consentWithdrawnAt === "undefined") {
        updates.consentWithdrawnAt =
          existingData.consentWithdrawnAt || FieldValue.serverTimestamp();
      }
    } else if (consentGranted) {
      if (typeof updates.consentCapturedAt === "undefined") {
        updates.consentCapturedAt =
          existingData.consentCapturedAt || FieldValue.serverTimestamp();
      }
      if (typeof updates.consentWithdrawnAt === "undefined") {
        updates.consentWithdrawnAt = null;
      }
    } else if (hasConsentGranted && !consentGranted) {
      if (typeof updates.consentWithdrawnAt === "undefined") {
        updates.consentWithdrawnAt =
          existingData.consentWithdrawnAt || FieldValue.serverTimestamp();
      }
    }

    updates.updatedAt = FieldValue.serverTimestamp();

    await docRef.update(sanitizePayload(updates));
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: "Nu am putut actualiza abonatul." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    await db.collection("newsletter_subscribers").doc(id).delete();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: "Nu am putut șterge abonatul." },
      { status: 500 }
    );
  }
}

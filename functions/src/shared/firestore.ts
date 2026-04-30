import crypto from "crypto";
import {
  FieldValue,
  Firestore,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { getDefaultFirebaseApp } from "./firebaseAdmin";
import { NewsletterSubscriberStatus } from "./newsletterTypes";

export type NewsletterLogLevel = "info" | "error" | "warning";
export type NewsletterSettings = {
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  baseUrl?: string;
  maxPerSecond?: number;
  maxConcurrent?: number;
};

const LEGACY_CONSENT_SOURCE = "legacy";
const LEGACY_CONSENT_TEXT_VERSION = "legacy-unknown";
const CONSENT_METHOD = "single_opt_in";

export function getDb(): Firestore {
  return getFirestore(getDefaultFirebaseApp());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function ensureSubscriberFields(
  subscriberRef: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData
): Promise<FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>> {
  const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {};

  if (typeof data.email === "string") {
    const normalized = normalizeEmail(data.email);
    if (normalized !== data.email) {
      updates.email = normalized;
    }
    if (data.emailNormalized !== normalized) {
      updates.emailNormalized = normalized;
    }
  }

  if (!data.status) {
    updates.status = "active";
  }

  if (!data.createdAt) {
    updates.createdAt = FieldValue.serverTimestamp();
  }

  if (typeof data.consentGranted !== "boolean") {
    updates.consentGranted = true;
  }

  if (!data.consentSource) {
    updates.consentSource = LEGACY_CONSENT_SOURCE;
  }

  if (!data.consentTextVersion) {
    updates.consentTextVersion = LEGACY_CONSENT_TEXT_VERSION;
  }

  if (!data.consentMethod) {
    updates.consentMethod = CONSENT_METHOD;
  }

  const consentGranted =
    typeof data.consentGranted === "boolean" ? data.consentGranted : true;

  if (consentGranted && !data.consentCapturedAt) {
    updates.consentCapturedAt = data.createdAt || FieldValue.serverTimestamp();
  }

  if (!data.unsubscribeToken) {
    updates.unsubscribeToken = generateToken();
  }

  if (Object.keys(updates).length > 0) {
    await subscriberRef.update(updates);
  }

  return updates;
}

export function readSubscriberStatus(
  value: unknown
): NewsletterSubscriberStatus {
  if (
    value === "active" ||
    value === "unsubscribed" ||
    value === "bounced" ||
    value === "complaint" ||
    value === "suppressed"
  ) {
    return value;
  }
  return "active";
}

export function isSubscriberEligibleForSend(
  data: FirebaseFirestore.DocumentData | null
): boolean {
  if (!data) {
    return false;
  }
  const status = readSubscriberStatus(data.status);
  const consentGranted =
    typeof data.consentGranted === "boolean" ? data.consentGranted : true;

  return status === "active" && consentGranted === true;
}

export async function getSubscriberByToken(
  db: Firestore,
  token: string
): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const snapshot = await db
    .collection("newsletter_subscribers")
    .where("unsubscribeToken", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0];
}

const CAMPAIGN_NAME_CACHE = new Map<string, { name: string | null; at: number }>();
const CAMPAIGN_NAME_CACHE_MS = 60_000;

async function getCampaignDisplayName(
  db: Firestore,
  campaignId: string
): Promise<string | null> {
  const now = Date.now();
  const cached = CAMPAIGN_NAME_CACHE.get(campaignId);
  if (cached && now - cached.at < CAMPAIGN_NAME_CACHE_MS) {
    return cached.name;
  }
  try {
    const snap = await db.collection("newsletter_campaigns").doc(campaignId).get();
    const data = snap.exists ? snap.data() || {} : {};
    const name = readString(data.subject) || readString(data.name) || null;
    CAMPAIGN_NAME_CACHE.set(campaignId, { name: name ?? null, at: now });
    return name ?? null;
  } catch {
    return null;
  }
}

export async function logNewsletterEvent(
  db: Firestore,
  payload: {
    campaignId?: string;
    campaignName?: string | null;
    email?: string;
    level: NewsletterLogLevel;
    message: string;
  }
): Promise<void> {
  let campaignName =
    typeof payload.campaignName === "string" && payload.campaignName.trim() ?
      payload.campaignName.trim()
    : null;

  if (!campaignName && payload.campaignId) {
    campaignName = await getCampaignDisplayName(db, payload.campaignId);
  }

  await db.collection("newsletter_logs").add({
    campaignId: payload.campaignId ?? null,
    campaignName: campaignName ?? null,
    email: payload.email ?? null,
    level: payload.level,
    message: payload.message,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export function toTimestamp(value?: FirebaseFirestore.Timestamp | null) {
  return value ?? Timestamp.now();
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function getNewsletterSettings(
  db: Firestore
): Promise<NewsletterSettings | null> {
  // Small in-memory cache to avoid a Firestore read per email/task.
  // Functions instances are reused, so this can cut read costs significantly.
  const CACHE_MS = 60_000;
  const now = Date.now();
  if (
    (globalThis as any).__newsletterSettingsCache &&
    typeof (globalThis as any).__newsletterSettingsCacheAt === "number" &&
    now - (globalThis as any).__newsletterSettingsCacheAt < CACHE_MS
  ) {
    return (globalThis as any).__newsletterSettingsCache as NewsletterSettings | null;
  }

  const snap = await db.collection("newsletter_settings").doc("default").get();
  if (!snap.exists) {
    (globalThis as any).__newsletterSettingsCache = null;
    (globalThis as any).__newsletterSettingsCacheAt = now;
    return null;
  }
  const data = snap.data() || {};
  const settings = {
    fromName: readString(data.fromName),
    fromEmail: readString(data.fromEmail),
    replyTo: readString(data.replyTo),
    baseUrl: readString(data.baseUrl),
    maxPerSecond: readNumber(data.maxPerSecond),
    maxConcurrent: readNumber(data.maxConcurrent),
  };
  (globalThis as any).__newsletterSettingsCache = settings;
  (globalThis as any).__newsletterSettingsCacheAt = now;
  return settings;
}

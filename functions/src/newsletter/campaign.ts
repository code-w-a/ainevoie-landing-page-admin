import { FieldValue } from "firebase-admin/firestore";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import {
  DEFAULT_MAX_CONCURRENT,
  DEFAULT_MAX_PER_SECOND,
  REGION,
} from "./constants";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import {
  NEWSLETTER_FROM_EMAIL,
  NEWSLETTER_FROM_NAME,
} from "../shared/mailer";
import {
  getDb,
  getNewsletterSettings,
  logNewsletterEvent,
} from "../shared/firestore";
import { withSentryFunction } from "../shared/sentry";
import { sanitizeFirestorePayload } from "../shared/sanitize";

type CampaignFilters = {
  tags?: string[];
};

type SendConfig = {
  maxPerSecond?: number;
  maxConcurrent?: number;
};

function toTemplateData(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter(
    ([key, val]) => key.trim() && typeof val === "string"
  );
  if (!entries.length) {
    return null;
  }

  return Object.fromEntries(entries) as Record<string, string>;
}

export const createNewsletterCampaign = onCall(
  {
    region: REGION,
    invoker: "public",
    secrets: [ADMIN_API_KEY, NEWSLETTER_FROM_NAME, NEWSLETTER_FROM_EMAIL],
  },
  withSentryFunction("createNewsletterCampaign", async (request: CallableRequest<any>) => {
    requireAdmin(request);

    const {
      subject,
      previewText,
      html,
      text,
      filters,
      sendConfig,
      fromName,
      fromEmail,
      replyTo,
      templateId,
      templateData,
      templateVersion,
    } = request.data ?? {};

    if (!subject || typeof subject !== "string") {
      throw new HttpsError("invalid-argument", "Missing subject");
    }

    if (!html || typeof html !== "string") {
      throw new HttpsError("invalid-argument", "Missing html content");
    }

    const db = getDb();
    const campaignRef = db.collection("newsletter_campaigns").doc();
    const campaignId = campaignRef.id;
    const normalizedTags = Array.isArray(filters?.tags)
      ? filters.tags
          .filter((tag: string) => typeof tag === "string")
          .slice(0, 10)
      : null;
    const resolvedFilters: CampaignFilters | null = normalizedTags
      ? { tags: normalizedTags }
      : null;

    const settings = await getNewsletterSettings(db);
    const resolvedSendConfig: SendConfig = {
      maxPerSecond:
        typeof sendConfig?.maxPerSecond === "number"
          ? sendConfig.maxPerSecond
          : settings?.maxPerSecond ?? DEFAULT_MAX_PER_SECOND,
      maxConcurrent:
        typeof sendConfig?.maxConcurrent === "number"
          ? sendConfig.maxConcurrent
          : settings?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT,
    };

    const resolvedFromEmail =
      fromEmail ?? settings?.fromEmail ?? NEWSLETTER_FROM_EMAIL.value() ?? "";
    if (!resolvedFromEmail) {
      throw new HttpsError(
        "failed-precondition",
        "Missing fromEmail or NEWSLETTER_FROM_EMAIL secret"
      );
    }
    const resolvedFromName =
      fromName ?? settings?.fromName ?? NEWSLETTER_FROM_NAME.value() ?? "";
    const resolvedReplyTo = replyTo ?? settings?.replyTo ?? null;

    await campaignRef.set(sanitizeFirestorePayload({
      subject,
      previewText: previewText ?? null,
      html,
      text: text ?? null,
      fromName: resolvedFromName,
      fromEmail: resolvedFromEmail,
      replyTo: resolvedReplyTo,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: request.auth?.uid ?? "system",
      status: "draft",
      templateId: typeof templateId === "string" ? templateId : null,
      templateData: toTemplateData(templateData),
      templateVersion: typeof templateVersion === "string" ? templateVersion : null,
      filters: resolvedFilters || {},
      scheduledAt: null,
      scheduledTimezone: null,
      scheduleTaskId: null,
      queuedAt: null,
      startedAt: null,
      completedAt: null,
      lastError: null,
      stats: {
        total: 0,
        queued: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      },
      sendConfig: resolvedSendConfig,
    }));

    await logNewsletterEvent(db, {
      campaignId,
      campaignName: subject,
      level: "info",
      message: "Campanie creată ca draft.",
    });

    return {
      campaignId,
      status: "draft",
    };
  })
);

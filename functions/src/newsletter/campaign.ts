import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import {
  NEWSLETTER_FROM_EMAIL,
  NEWSLETTER_FROM_NAME,
} from "../shared/mailer";
import {
  ensureSubscriberFields,
  getDb,
  getNewsletterSettings,
  hashEmail,
  logNewsletterEvent,
  normalizeEmail,
} from "../shared/firestore";

const DEFAULT_MAX_PER_SECOND = 5;
const DEFAULT_MAX_CONCURRENT = 50;

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
    region: "europe-west1",
    invoker: "public",
    secrets: [ADMIN_API_KEY, NEWSLETTER_FROM_NAME, NEWSLETTER_FROM_EMAIL],
  },
  async (request) => {
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
    const resolvedFilters: CampaignFilters = {
      tags: Array.isArray(filters?.tags)
        ? filters.tags
            .filter((tag: string) => typeof tag === "string")
            .slice(0, 10)
        : undefined,
    };

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

    await campaignRef.set({
      subject,
      previewText: previewText ?? null,
      html,
      text: text ?? null,
      fromName: resolvedFromName,
      fromEmail: resolvedFromEmail,
      replyTo: resolvedReplyTo,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth?.uid ?? "system",
      status: "queued",
      templateId: typeof templateId === "string" ? templateId : null,
      templateData: toTemplateData(templateData),
      templateVersion: typeof templateVersion === "string" ? templateVersion : null,
      filters: resolvedFilters,
      stats: {
        total: 0,
        queued: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      },
      sendConfig: resolvedSendConfig,
    });

    let query = db
      .collection("newsletter_subscribers")
      .where("status", "==", "active");

    if (resolvedFilters.tags && resolvedFilters.tags.length > 0) {
      query = query.where("tags", "array-contains-any", resolvedFilters.tags);
    }

    const subscribersSnapshot = await query.get();

    const jobPaths: string[] = [];
    let total = 0;
    let queued = 0;
    let skipped = 0;

    for (const doc of subscribersSnapshot.docs) {
      const data = doc.data();
      if (!data.email || typeof data.email !== "string") {
        skipped += 1;
        await logNewsletterEvent(db, {
          campaignId,
          level: "error",
          message: `Subscriber ${doc.id} missing email, skipped.`,
        });
        continue;
      }

      const email = normalizeEmail(data.email);
      if (!email.includes("@")) {
        skipped += 1;
        await logNewsletterEvent(db, {
          campaignId,
          level: "error",
          message: `Invalid email format for subscriber ${doc.id}.`,
        });
        continue;
      }
      await ensureSubscriberFields(doc.ref, data);

      const jobId = hashEmail(email);
      const jobRef = campaignRef.collection("jobs").doc(jobId);

      try {
        await jobRef.create({
          campaignId,
          subscriberRef: doc.ref,
          email,
          status: "queued",
          attempts: 0,
          createdAt: FieldValue.serverTimestamp(),
          dedupeKey: `${campaignId}:${email}`,
        });
        jobPaths.push(jobRef.path);
        total += 1;
        queued += 1;
      } catch (error) {
        skipped += 1;
        const errorString = String(error);
        const isDuplicate =
          errorString.includes("ALREADY_EXISTS") ||
          errorString.toLowerCase().includes("already exists");
        await logNewsletterEvent(db, {
          campaignId,
          email,
          level: isDuplicate ? "info" : "error",
          message: isDuplicate
            ? `Job already exists for ${email}, skipped.`
            : `Failed to create job for ${email}: ${errorString}`,
        });
      }
    }

    await campaignRef.update({
      "stats.total": total,
      "stats.queued": queued,
      "stats.skipped": skipped,
      status: total === 0 ? "sent" : "queued",
      completedAt: total === 0 ? FieldValue.serverTimestamp() : null,
    });

    const queue = getFunctions().taskQueue("newsletter-send");
    const maxPerSecond = Math.max(
      1,
      resolvedSendConfig.maxPerSecond || DEFAULT_MAX_PER_SECOND
    );

    await Promise.all(
      jobPaths.map((jobPath, index) => {
        const delaySeconds = Math.floor(index / maxPerSecond);
        return queue.enqueue(
          { campaignId, jobPath },
          { scheduleDelaySeconds: delaySeconds }
        );
      })
    );

    return {
      campaignId,
      counts: {
        total,
        queued,
        skipped,
      },
    };
  }
);

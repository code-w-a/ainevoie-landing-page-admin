import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import {
  DEFAULT_MAX_CONCURRENT,
  DEFAULT_MAX_PER_SECOND,
  SEND_QUEUE_FUNCTION,
} from "./constants";
import {
  ensureSubscriberFields,
  getDb,
  getNewsletterSettings,
  hashEmail,
  isSubscriberEligibleForSend,
  logNewsletterEvent,
  normalizeEmail,
} from "../shared/firestore";
import { captureFunctionException } from "../shared/sentry";
import { sanitizeFirestorePayload } from "../shared/sanitize";

type CampaignFilters = {
  tags?: string[];
};

type SendConfig = {
  maxPerSecond?: number;
  maxConcurrent?: number;
};

type DispatchOptions = {
  campaignId: string;
  filters?: CampaignFilters | null;
  sendConfig?: SendConfig | null;
};

export type DispatchResult = {
  total: number;
  queued: number;
  skipped: number;
};

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item: string) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export async function dispatchCampaignJobs(
  options: DispatchOptions
): Promise<DispatchResult> {
  const db = getDb();
  const campaignRef = db.collection("newsletter_campaigns").doc(options.campaignId);
  const campaignSnap = await campaignRef.get();

  if (!campaignSnap.exists) {
    throw new Error("Campaign not found.");
  }

  const campaignData = campaignSnap.data() || {};
  const settings = await getNewsletterSettings(db);
  const rawSendConfig = readObject(options.sendConfig);

  const resolvedSendConfig: SendConfig = {
    maxPerSecond:
      typeof rawSendConfig.maxPerSecond === "number" ?
        rawSendConfig.maxPerSecond :
        settings?.maxPerSecond ?? DEFAULT_MAX_PER_SECOND,
    maxConcurrent:
      typeof rawSendConfig.maxConcurrent === "number" ?
        rawSendConfig.maxConcurrent :
        settings?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT,
  };

  const tags = normalizeTags(options.filters?.tags);
  const resolvedFilters = tags.length > 0 ? { tags } : {};

  const baseQuery = db
    .collection("newsletter_subscribers")
    .where("status", "==", "active");
  const consentTrueQuery = baseQuery.where("consentGranted", "==", true);
  const consentLegacyQuery = baseQuery.where("consentGranted", "==", null);

  const queries = [consentTrueQuery, consentLegacyQuery].map((query) =>
    tags.length > 0 ? query.where("tags", "array-contains-any", tags) : query
  );

  const subscriberSnapshots = await Promise.all(
    queries.map((query) => query.get())
  );

  const subscribersMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  for (const snapshot of subscriberSnapshots) {
    for (const doc of snapshot.docs) {
      subscribersMap.set(doc.id, doc);
    }
  }

  const queue = getFunctions().taskQueue(SEND_QUEUE_FUNCTION);

  let total = 0;
  let queued = 0;
  let skipped = 0;
  const jobPaths: string[] = [];

  for (const subscriberDoc of subscribersMap.values()) {
    const subscriberData = subscriberDoc.data() || {};
    await ensureSubscriberFields(subscriberDoc.ref, subscriberData);

    if (!isSubscriberEligibleForSend(subscriberData)) {
      skipped += 1;
      await logNewsletterEvent(db, {
        campaignId: options.campaignId,
        level: "info",
        email: typeof subscriberData.email === "string" ?
          normalizeEmail(subscriberData.email) :
          undefined,
        message: "Abonat neeligibil pentru trimitere.",
      });
      continue;
    }

    const email = typeof subscriberData.email === "string" ?
      normalizeEmail(subscriberData.email) :
      "";
    if (!email.includes("@")) {
      skipped += 1;
      await logNewsletterEvent(db, {
        campaignId: options.campaignId,
        level: "error",
        message: `Email invalid pentru abonatul ${subscriberDoc.id}.`,
      });
      continue;
    }

    const jobId = hashEmail(email);
    const jobRef = campaignRef.collection("jobs").doc(jobId);

    try {
      await jobRef.create(sanitizeFirestorePayload({
        campaignId: options.campaignId,
        subscriberRef: subscriberDoc.ref,
        email,
        status: "queued",
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        dedupeKey: `${options.campaignId}:${email}`,
        errorCode: null,
        errorKind: null,
        lastError: null,
      }));
      total += 1;
      queued += 1;
      jobPaths.push(jobRef.path);
    } catch (error) {
      skipped += 1;
      const errorText = String(error);
      const duplicate =
        errorText.includes("ALREADY_EXISTS") ||
        errorText.toLowerCase().includes("already exists");

      if (!duplicate) {
        await captureFunctionException(error, {
          handler: "dispatchCampaignJobs",
          tags: { campaign_id: options.campaignId },
          extra: { email },
        });
      }

      await logNewsletterEvent(db, {
        campaignId: options.campaignId,
        email,
        level: duplicate ? "info" : "error",
        message: duplicate ?
          "Job duplicat: deja existent." :
          `Nu am putut crea jobul: ${errorText}`,
      });
    }
  }

  const maxPerSecond = Math.max(
    1,
    Number(resolvedSendConfig.maxPerSecond || DEFAULT_MAX_PER_SECOND)
  );

  if (jobPaths.length > 0) {
    await Promise.all(
      jobPaths.map((jobPath, index) => {
        const delaySeconds = Math.floor(index / maxPerSecond);
        return queue.enqueue(
          { campaignId: options.campaignId, jobPath },
          { scheduleDelaySeconds: delaySeconds }
        );
      })
    );
  }

  await campaignRef.update(sanitizeFirestorePayload({
    status: total === 0 ? "sent" : "queued",
    filters: resolvedFilters,
    sendConfig: resolvedSendConfig,
    queuedAt: FieldValue.serverTimestamp(),
    startedAt: total > 0 ? null : FieldValue.delete(),
    completedAt: total === 0 ? FieldValue.serverTimestamp() : null,
    lastError: FieldValue.delete(),
    stats: {
      total,
      queued,
      sent: 0,
      failed: 0,
      skipped,
    },
    updatedAt: FieldValue.serverTimestamp(),
  }));

  await logNewsletterEvent(db, {
    campaignId: options.campaignId,
    level: "info",
    message: `Dispatch inițiat. total=${total}, queued=${queued}, skipped=${skipped}`,
  });

  if (total > 0 && campaignData.status !== "sending") {
    await campaignRef.update({
      status: "queued",
    });
  }

  return { total, queued, skipped };
}

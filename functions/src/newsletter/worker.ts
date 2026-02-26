import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import {
  REGION,
  RETRY_DELAYS_SECONDS,
  SEND_QUEUE_FUNCTION,
} from "./constants";
import {
  NEWSLETTER_FROM_EMAIL,
  NEWSLETTER_FROM_NAME,
  NEWSLETTER_REPLY_TO,
  PUBLIC_BASE_URL,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  buildUnsubscribeUrl,
  sendNewsletterEmail,
} from "../shared/mailer";
import {
  ensureSubscriberFields,
  generateToken,
  getDb,
  getNewsletterSettings,
  isSubscriberEligibleForSend,
  logNewsletterEvent,
  normalizeEmail,
} from "../shared/firestore";
import { NewsletterErrorKind } from "../shared/newsletterTypes";

type ClassifiedError = {
  kind: NewsletterErrorKind;
  code: string;
  message: string;
};

function classifySmtpError(error: unknown): ClassifiedError {
  const message = String(error);
  const errorObj = error as {
    code?: string;
    responseCode?: number;
    response?: string;
  };

  const code = typeof errorObj?.code === "string" ? errorObj.code : "UNKNOWN";
  const responseCode =
    typeof errorObj?.responseCode === "number" ? errorObj.responseCode : 0;
  const responseText =
    typeof errorObj?.response === "string" ? errorObj.response : message;

  const permanentSmtpCode = responseCode >= 500 && responseCode <= 599;
  const transientSmtpCode = responseCode >= 400 && responseCode <= 499;
  const permanentByMessage = /\b5\d\d\b/.test(responseText);

  if (permanentSmtpCode || permanentByMessage) {
    return {
      kind: "bounce",
      code: responseCode ? `SMTP_${responseCode}` : code,
      message,
    };
  }

  if (
    transientSmtpCode ||
    ["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNRESET"].includes(code)
  ) {
    return {
      kind: "transient",
      code: responseCode ? `SMTP_${responseCode}` : code,
      message,
    };
  }

  return {
    kind: "permanent",
    code: responseCode ? `SMTP_${responseCode}` : code,
    message,
  };
}

async function maybeCompleteCampaign(
  campaignRef: FirebaseFirestore.DocumentReference
) {
  const snap = await campaignRef.get();
  if (!snap.exists) {
    return;
  }
  const data = snap.data() || {};
  const stats = data.stats || {};
  const total = Number(stats.total || 0);
  const queued = Number(stats.queued || 0);
  const sent = Number(stats.sent || 0);
  const failed = Number(stats.failed || 0);
  const skipped = Number(stats.skipped || 0);

  const done = total === 0 || (queued <= 0 && sent + failed + skipped >= total);
  if (!done) {
    return;
  }

  const finalStatus = failed > 0 ? "sent_with_errors" : "sent";
  if (data.status !== finalStatus) {
    await campaignRef.update({
      status: finalStatus,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

export const newsletterSendTask = onTaskDispatched(
  {
    region: REGION,
    secrets: [
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      NEWSLETTER_FROM_NAME,
      NEWSLETTER_FROM_EMAIL,
      NEWSLETTER_REPLY_TO,
      PUBLIC_BASE_URL,
    ],
    rateLimits: {
      maxDispatchesPerSecond: 5,
      maxConcurrentDispatches: 50,
    },
  },
  async (request) => {
    const { campaignId, jobPath } = request.data as {
      campaignId?: string;
      jobPath?: string;
    };

    if (!campaignId || !jobPath) {
      return;
    }

    const db = getDb();
    const jobRef = db.doc(jobPath);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      return;
    }

    const jobData = jobSnap.data() || {};
    const jobStatus = jobData.status;
    if (jobStatus === "sent" || jobStatus === "skipped") {
      return;
    }
    if (jobStatus === "sending") {
      return;
    }

    let attempts = 0;
    const transactionResult = await db.runTransaction(async (tx) => {
      const snap = await tx.get(jobRef);
      if (!snap.exists) {
        return false;
      }
      const data = snap.data() || {};
      if (["sent", "skipped", "sending"].includes(String(data.status || ""))) {
        return false;
      }
      attempts = Number(data.attempts || 0) + 1;
      tx.update(jobRef, {
        status: "sending",
        attempts,
        lastError: FieldValue.delete(),
        errorCode: FieldValue.delete(),
        errorKind: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (!transactionResult) {
      return;
    }

    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      await jobRef.update({
        status: "failed",
        lastError: "Campaign not found",
        errorCode: "CAMPAIGN_NOT_FOUND",
        errorKind: "permanent",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await logNewsletterEvent(db, {
        campaignId,
        email: typeof jobData.email === "string" ? normalizeEmail(jobData.email) : undefined,
        level: "error",
        message: "Campania nu există pentru acest job.",
      });
      return;
    }

    const campaign = campaignSnap.data() || {};
    if (campaign.status && !["queued", "sending"].includes(String(campaign.status))) {
      await jobRef.update({
        status: "skipped",
        lastError: `Campaign status ${campaign.status}`,
        errorCode: "CAMPAIGN_NOT_SENDABLE",
        errorKind: "permanent",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await campaignRef.update({
        "stats.skipped": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await maybeCompleteCampaign(campaignRef);
      return;
    }

    if (campaign.status === "queued") {
      await campaignRef.update({
        status: "sending",
        startedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    let subscriberData = null as FirebaseFirestore.DocumentData | null;
    let subscriberRef = null as FirebaseFirestore.DocumentReference | null;

    if (jobData.subscriberRef) {
      subscriberRef = jobData.subscriberRef as FirebaseFirestore.DocumentReference;
      const subscriberSnap = await subscriberRef.get();
      if (subscriberSnap.exists) {
        subscriberData = subscriberSnap.data() || null;
      }
    }

    if (subscriberRef && subscriberData) {
      await ensureSubscriberFields(subscriberRef, subscriberData);
      const refreshed = await subscriberRef.get();
      subscriberData = refreshed.exists ? refreshed.data() || null : subscriberData;
    }

    if (!isSubscriberEligibleForSend(subscriberData)) {
      await jobRef.update({
        status: "skipped",
        lastError: "Subscriber not eligible",
        errorCode: "SUBSCRIBER_NOT_ELIGIBLE",
        errorKind: "permanent",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await campaignRef.update({
        "stats.skipped": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await maybeCompleteCampaign(campaignRef);
      await logNewsletterEvent(db, {
        campaignId,
        email: typeof jobData.email === "string" ? normalizeEmail(jobData.email) : undefined,
        level: "info",
        message: "Abonat neeligibil, job ignorat.",
      });
      return;
    }

    const email =
      typeof jobData.email === "string" ? normalizeEmail(jobData.email) : "";
    if (!email.includes("@")) {
      await jobRef.update({
        status: "failed",
        lastError: "Missing or invalid email on job",
        errorCode: "JOB_EMAIL_INVALID",
        errorKind: "permanent",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await campaignRef.update({
        "stats.failed": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await maybeCompleteCampaign(campaignRef);
      await logNewsletterEvent(db, {
        campaignId,
        level: "error",
        message: "Job fără email valid.",
      });
      return;
    }

    const settings = await getNewsletterSettings(db);
    const unsubscribeToken = subscriberData?.unsubscribeToken || generateToken();
    const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken, settings?.baseUrl);

    if (subscriberRef && subscriberData && !subscriberData.unsubscribeToken) {
      await subscriberRef.update({
        unsubscribeToken,
      });
    }

    try {
      await sendNewsletterEmail({
        to: email,
        subject: campaign.subject,
        html: campaign.html,
        text: campaign.text || undefined,
        previewText: campaign.previewText || undefined,
        fromName: campaign.fromName || undefined,
        fromEmail: campaign.fromEmail || undefined,
        replyTo: campaign.replyTo || undefined,
        unsubscribeUrl,
      });

      await jobRef.update({
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
        errorCode: null,
        errorKind: null,
        lastError: null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await campaignRef.update({
        "stats.sent": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await maybeCompleteCampaign(campaignRef);

      if (subscriberRef) {
        await subscriberRef.update({
          lastSentAt: FieldValue.serverTimestamp(),
        });
      }

      await logNewsletterEvent(db, {
        campaignId,
        email,
        level: "info",
        message: "Email trimis cu succes.",
      });
    } catch (error) {
      const classified = classifySmtpError(error);
      const canRetry = classified.kind === "transient" && attempts < 3;
      const retryIndex = Math.max(0, attempts - 1);

      if (canRetry) {
        await jobRef.update({
          status: "queued",
          lastError: classified.message,
          errorCode: classified.code,
          errorKind: classified.kind,
          updatedAt: FieldValue.serverTimestamp(),
        });

        const delaySeconds =
          RETRY_DELAYS_SECONDS[retryIndex] || RETRY_DELAYS_SECONDS.at(-1) || 600;
        const queue = getFunctions().taskQueue(SEND_QUEUE_FUNCTION);
        await queue.enqueue(
          { campaignId, jobPath },
          { scheduleDelaySeconds: delaySeconds }
        );

        await logNewsletterEvent(db, {
          campaignId,
          email,
          level: "warning",
          message: `Trimitere eșuată temporar, retry programat: ${classified.message}`,
        });
        return;
      }

      await jobRef.update({
        status: "failed",
        lastError: classified.message,
        errorCode: classified.code,
        errorKind: classified.kind,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await campaignRef.update({
        "stats.failed": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await maybeCompleteCampaign(campaignRef);

      if (classified.kind === "bounce" && subscriberRef) {
        await subscriberRef.update({
          status: "bounced",
          bouncedAt: FieldValue.serverTimestamp(),
          statusReason: classified.message.slice(0, 500),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      await logNewsletterEvent(db, {
        campaignId,
        email,
        level: "error",
        message: `Trimitere eșuată definitiv: ${classified.message}`,
      });
    }
  }
);

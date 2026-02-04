import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
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
  logNewsletterEvent,
} from "../shared/firestore";

const RETRY_DELAYS_SECONDS = [30, 120, 600];

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

  if (total === 0 || (queued <= 0 && sent + failed + skipped >= total)) {
    if (data.status !== "sent") {
      await campaignRef.update({
        status: "sent",
        completedAt: FieldValue.serverTimestamp(),
      });
    }
  }
}

export const newsletterSendTask = onTaskDispatched(
  {
    region: "europe-west1",
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
      if (data.status === "sent" || data.status === "skipped") {
        return false;
      }
      if (data.status === "sending") {
        return false;
      }
      attempts = (data.attempts || 0) + 1;
      tx.update(jobRef, {
        status: "sending",
        attempts,
        lastError: FieldValue.delete(),
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
      });
      await logNewsletterEvent(db, {
        campaignId,
        email: jobData.email,
        level: "error",
        message: "Campaign not found for job.",
      });
      return;
    }

    const campaign = campaignSnap.data() || {};
    if (campaign.status && !["queued", "sending", "sent"].includes(campaign.status)) {
      await jobRef.update({
        status: "skipped",
        lastError: `Campaign status ${campaign.status}`,
      });
      await campaignRef.update({
        "stats.skipped": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
      });
      return;
    }

    if (campaign.status === "queued") {
      await campaignRef.update({
        status: "sending",
        startedAt: FieldValue.serverTimestamp(),
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

    if (subscriberData && subscriberData.status && subscriberData.status !== "active") {
      await jobRef.update({
        status: "skipped",
        lastError: "Subscriber not active",
      });
      await campaignRef.update({
        "stats.skipped": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
      });
      await maybeCompleteCampaign(campaignRef);
      await logNewsletterEvent(db, {
        campaignId,
        email: jobData.email,
        level: "info",
        message: "Subscriber inactive, skipped.",
      });
      return;
    }

    if (subscriberRef && subscriberData) {
      await ensureSubscriberFields(subscriberRef, subscriberData);
    }

    const settings = await getNewsletterSettings(db);
    const unsubscribeToken = subscriberData?.unsubscribeToken || generateToken();
    const unsubscribeUrl = buildUnsubscribeUrl(
      unsubscribeToken,
      settings?.baseUrl
    );

    if (subscriberRef && subscriberData && !subscriberData.unsubscribeToken) {
      await subscriberRef.update({ unsubscribeToken });
    }

    if (!jobData.email) {
      await jobRef.update({
        status: "failed",
        lastError: "Missing email on job",
      });
      await campaignRef.update({
        "stats.failed": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
      });
      await maybeCompleteCampaign(campaignRef);
      await logNewsletterEvent(db, {
        campaignId,
        level: "error",
        message: "Job missing email, failed.",
      });
      return;
    }

    try {
      await sendNewsletterEmail({
        to: jobData.email,
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
      });

      await campaignRef.update({
        "stats.sent": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
      });
      await maybeCompleteCampaign(campaignRef);

      if (subscriberRef) {
        await subscriberRef.update({
          lastSentAt: FieldValue.serverTimestamp(),
        });
      }

      await logNewsletterEvent(db, {
        campaignId,
        email: jobData.email,
        level: "info",
        message: "Email sent successfully.",
      });
    } catch (error) {
      const errorMessage = String(error);
      const retryIndex = Math.max(0, attempts - 1);
      const canRetry = attempts < 3;

      if (canRetry) {
        await jobRef.update({
          status: "queued",
          lastError: errorMessage,
        });

        const delaySeconds =
          RETRY_DELAYS_SECONDS[retryIndex] || RETRY_DELAYS_SECONDS.at(-1) || 600;
        const queue = getFunctions().taskQueue("newsletter-send");
        await queue.enqueue(
          { campaignId, jobPath },
          { scheduleDelaySeconds: delaySeconds }
        );

        await logNewsletterEvent(db, {
          campaignId,
          email: jobData.email,
          level: "error",
          message: `Send failed, retry scheduled: ${errorMessage}`,
        });
        return;
      }

      await jobRef.update({
        status: "failed",
        lastError: errorMessage,
      });

      await campaignRef.update({
        "stats.failed": FieldValue.increment(1),
        "stats.queued": FieldValue.increment(-1),
      });
      await maybeCompleteCampaign(campaignRef);

      await logNewsletterEvent(db, {
        campaignId,
        email: jobData.email,
        level: "error",
        message: `Send failed permanently: ${errorMessage}`,
      });
    }
  }
);

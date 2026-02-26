import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { dispatchCampaignJobs } from "./dispatch";
import { REGION } from "./constants";
import { getDb, logNewsletterEvent } from "../shared/firestore";

export const newsletterCampaignStartTask = onTaskDispatched(
  {
    region: REGION,
    rateLimits: {
      maxDispatchesPerSecond: 50,
      maxConcurrentDispatches: 50,
    },
  },
  async (request) => {
    const campaignId = typeof request.data?.campaignId === "string" ?
      request.data.campaignId.trim() :
      "";
    const scheduleTaskId = typeof request.data?.scheduleTaskId === "string" ?
      request.data.scheduleTaskId.trim() :
      "";

    if (!campaignId || !scheduleTaskId) {
      return;
    }

    const db = getDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
      return;
    }

    const campaignData = campaignSnap.data() || {};
    const status = typeof campaignData.status === "string" ?
      campaignData.status :
      "draft";
    const currentTaskId = typeof campaignData.scheduleTaskId === "string" ?
      campaignData.scheduleTaskId :
      "";

    if (status !== "scheduled" || currentTaskId !== scheduleTaskId) {
      return;
    }

    try {
      await campaignRef.update({
        status: "queued",
        scheduleTaskId: null,
        scheduledAt: null,
        scheduledTimezone: null,
        queuedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const filters =
        campaignData.filters &&
          typeof campaignData.filters === "object" &&
          !Array.isArray(campaignData.filters) ?
          campaignData.filters as Record<string, unknown> :
          {};
      const sendConfig =
        campaignData.sendConfig &&
          typeof campaignData.sendConfig === "object" &&
          !Array.isArray(campaignData.sendConfig) ?
          campaignData.sendConfig as Record<string, unknown> :
          {};

      const counts = await dispatchCampaignJobs({
        campaignId,
        filters,
        sendConfig,
      });

      await logNewsletterEvent(db, {
        campaignId,
        level: "info",
        message:
          `Pornire programată executată. queued=${counts.queued}, skipped=${counts.skipped}.`,
      });
    } catch (error) {
      await campaignRef.update({
        lastError: String(error),
        updatedAt: FieldValue.serverTimestamp(),
      });

      throw new HttpsError(
        "internal",
        "Nu am putut porni campania programată."
      );
    }
  }
);

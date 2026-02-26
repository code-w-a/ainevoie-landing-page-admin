import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { dispatchCampaignJobs } from "./dispatch";
import { REGION, START_QUEUE_FUNCTION } from "./constants";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import { getDb, logNewsletterEvent } from "../shared/firestore";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function deleteScheduledTaskIfExists(taskId: string): Promise<void> {
  const queue = getFunctions().taskQueue(START_QUEUE_FUNCTION);
  try {
    await queue.delete(taskId);
  } catch (error) {
    const message = String(error).toLowerCase();
    if (!message.includes("not-found")) {
      throw error;
    }
  }
}

export const sendNewsletterCampaignNow = onCall(
  {
    region: REGION,
    invoker: "public",
    secrets: [ADMIN_API_KEY],
  },
  async (request) => {
    requireAdmin(request);
    const campaignId = typeof request.data?.campaignId === "string" ?
      request.data.campaignId.trim() :
      "";

    if (!campaignId) {
      throw new HttpsError("invalid-argument", "Lipsește campaignId.");
    }

    const db = getDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    let filters: Record<string, unknown> = {};
    let sendConfig: Record<string, unknown> = {};
    let scheduledTaskId = "";

    await db.runTransaction(async (tx) => {
      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new HttpsError("not-found", "Campania nu există.");
      }

      const campaignData = campaignSnap.data() || {};
      const status = typeof campaignData.status === "string" ?
        campaignData.status :
        "draft";

      if (!["draft", "scheduled"].includes(status)) {
        throw new HttpsError(
          "failed-precondition",
          `Campania nu poate fi trimisă din statusul ${status}.`
        );
      }

      filters = isObject(campaignData.filters) ? campaignData.filters : {};
      sendConfig = isObject(campaignData.sendConfig) ? campaignData.sendConfig : {};
      scheduledTaskId = typeof campaignData.scheduleTaskId === "string" ?
        campaignData.scheduleTaskId :
        "";

      tx.update(campaignRef, {
        status: "queued",
        queuedAt: FieldValue.serverTimestamp(),
        startedAt: null,
        completedAt: null,
        lastError: FieldValue.delete(),
        scheduleTaskId: null,
        scheduledAt: null,
        scheduledTimezone: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (scheduledTaskId) {
      await deleteScheduledTaskIfExists(scheduledTaskId);
    }

    const counts = await dispatchCampaignJobs({
      campaignId,
      filters,
      sendConfig,
    });

    await logNewsletterEvent(db, {
      campaignId,
      level: "info",
      message: "Trimitere imediată inițiată de admin.",
    });

    const campaignSnap = await campaignRef.get();
    const status = campaignSnap.exists ?
      String(campaignSnap.get("status") || "queued") :
      "queued";

    return {
      campaignId,
      status,
      counts,
    };
  }
);

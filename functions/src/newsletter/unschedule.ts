import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { REGION, START_QUEUE_FUNCTION } from "./constants";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import { getDb, logNewsletterEvent } from "../shared/firestore";

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

export const unscheduleNewsletterCampaign = onCall(
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
    let scheduleTaskId = "";

    await db.runTransaction(async (tx) => {
      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new HttpsError("not-found", "Campania nu există.");
      }

      const campaignData = campaignSnap.data() || {};
      const status = typeof campaignData.status === "string" ?
        campaignData.status :
        "draft";

      if (status !== "scheduled") {
        throw new HttpsError(
          "failed-precondition",
          "Campania nu este programată."
        );
      }

      scheduleTaskId = typeof campaignData.scheduleTaskId === "string" ?
        campaignData.scheduleTaskId :
        "";

      tx.update(campaignRef, {
        status: "draft",
        scheduleTaskId: null,
        scheduledAt: null,
        scheduledTimezone: null,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
        lastError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (scheduleTaskId) {
      await deleteScheduledTaskIfExists(scheduleTaskId);
    }

    await logNewsletterEvent(db, {
      campaignId,
      level: "info",
      message: "Programarea campaniei a fost anulată.",
    });

    return {
      campaignId,
      status: "draft",
    };
  }
);

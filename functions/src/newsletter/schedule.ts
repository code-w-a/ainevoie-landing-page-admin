import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { REGION, START_QUEUE_FUNCTION } from "./constants";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import { getDb, logNewsletterEvent } from "../shared/firestore";
import { withSentryFunction } from "../shared/sentry";

const MIN_DELAY_SECONDS = 60;

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

export const scheduleNewsletterCampaign = onCall(
  {
    region: REGION,
    invoker: "public",
    secrets: [ADMIN_API_KEY],
  },
  withSentryFunction(
    "scheduleNewsletterCampaign",
    async (request: CallableRequest<any>) => {
    requireAdmin(request);
    const campaignId = typeof request.data?.campaignId === "string" ?
      request.data.campaignId.trim() :
      "";
    const scheduleAtIso = typeof request.data?.scheduleAtIso === "string" ?
      request.data.scheduleAtIso.trim() :
      "";
    const scheduleTimezone = typeof request.data?.scheduleTimezone === "string" &&
        request.data.scheduleTimezone.trim() ?
      request.data.scheduleTimezone.trim() :
      "Europe/Bucharest";

    if (!campaignId) {
      throw new HttpsError("invalid-argument", "Lipsește campaignId.");
    }
    if (!scheduleAtIso) {
      throw new HttpsError("invalid-argument", "Lipsește scheduleAtIso.");
    }

    const scheduleDate = new Date(scheduleAtIso);
    if (Number.isNaN(scheduleDate.getTime())) {
      throw new HttpsError("invalid-argument", "scheduleAtIso este invalid.");
    }

    const minDate = new Date(Date.now() + MIN_DELAY_SECONDS * 1000);
    if (scheduleDate.getTime() < minDate.getTime()) {
      throw new HttpsError(
        "failed-precondition",
        "Programarea trebuie să fie cu cel puțin 60s în viitor."
      );
    }

    const scheduleTaskId = `start-${campaignId}-${scheduleDate.getTime()}`;
    const db = getDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    let previousTaskId = "";

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
          `Campania nu poate fi programată din statusul ${status}.`
        );
      }

      previousTaskId = typeof campaignData.scheduleTaskId === "string" ?
        campaignData.scheduleTaskId :
        "";

      tx.update(campaignRef, {
        status: "scheduled",
        scheduledAt: scheduleDate.toISOString(),
        scheduledTimezone: scheduleTimezone,
        scheduleTaskId,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
        lastError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const queue = getFunctions().taskQueue(START_QUEUE_FUNCTION);
    try {
      await queue.enqueue(
        { campaignId, scheduleTaskId },
        {
          id: scheduleTaskId,
          scheduleTime: scheduleDate,
        }
      );
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("task-already-exists")) {
        await campaignRef.update({
          status: "draft",
          scheduleTaskId: null,
          scheduledAt: null,
          scheduledTimezone: null,
          lastError: String(error),
          updatedAt: FieldValue.serverTimestamp(),
        });
        throw error;
      }
    }

    if (previousTaskId && previousTaskId !== scheduleTaskId) {
      await deleteScheduledTaskIfExists(previousTaskId);
    }

    await logNewsletterEvent(db, {
      campaignId,
      level: "info",
      message: `Campanie programată pentru ${scheduleDate.toISOString()}.`,
    });

    return {
      campaignId,
      status: "scheduled",
      scheduledAt: scheduleDate.toISOString(),
      scheduleTaskId,
    };
    }
  )
);

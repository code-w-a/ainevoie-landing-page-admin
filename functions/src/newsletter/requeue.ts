import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { REGION, SEND_QUEUE_FUNCTION } from "./constants";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import { getDb, logNewsletterEvent } from "../shared/firestore";
import { withSentryFunction } from "../shared/sentry";

export const requeueFailedJobs = onCall(
  {
    region: REGION,
    invoker: "public",
    secrets: [ADMIN_API_KEY],
  },
  withSentryFunction("requeueFailedJobs", async (request: CallableRequest<any>) => {
    requireAdmin(request);

    const { campaignId } = request.data ?? {};
    if (!campaignId || typeof campaignId !== "string") {
      throw new HttpsError("invalid-argument", "Lipsește campaignId.");
    }

    const db = getDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    const jobsSnapshot = await campaignRef
      .collection("jobs")
      .where("status", "==", "failed")
      .get();

    const queue = getFunctions().taskQueue(SEND_QUEUE_FUNCTION);
    let requeued = 0;

    for (const jobDoc of jobsSnapshot.docs) {
      const jobRef = jobDoc.ref;
      await jobRef.update({
        status: "queued",
        errorCode: null,
        errorKind: null,
        lastError: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await queue.enqueue({ campaignId, jobPath: jobRef.path });
      requeued += 1;
    }

    if (requeued > 0) {
      await campaignRef.update({
        "stats.queued": FieldValue.increment(requeued),
        "stats.failed": FieldValue.increment(-requeued),
        status: "queued",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await logNewsletterEvent(db, {
      campaignId,
      level: "info",
      message: `Au fost recoadate ${requeued} joburi eșuate.`,
    });

    return { requeued };
  })
);

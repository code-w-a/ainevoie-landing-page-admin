import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import { getDb, logNewsletterEvent } from "../shared/firestore";

export const requeueFailedJobs = onCall(
  {
    region: "europe-west1",
    invoker: "public",
    secrets: [ADMIN_API_KEY],
  },
  async (request) => {
    requireAdmin(request);

    const { campaignId } = request.data ?? {};
    if (!campaignId || typeof campaignId !== "string") {
      throw new HttpsError("invalid-argument", "Missing campaignId");
    }

    const db = getDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    const jobsSnapshot = await campaignRef
      .collection("jobs")
      .where("status", "==", "failed")
      .get();

    const queue = getFunctions().taskQueue("newsletter-send");
    let requeued = 0;

    for (const jobDoc of jobsSnapshot.docs) {
      const jobRef = jobDoc.ref;
      await jobRef.update({
        status: "queued",
      });
      await queue.enqueue({ campaignId, jobPath: jobRef.path });
      requeued += 1;
    }

    if (requeued > 0) {
      await campaignRef.update({
        "stats.queued": FieldValue.increment(requeued),
        "stats.failed": FieldValue.increment(-requeued),
      });
    }

    await logNewsletterEvent(db, {
      campaignId,
      level: "info",
      message: `Requeued ${requeued} failed jobs.`,
    });

    return { requeued };
  }
);

import { NextResponse } from "next/server";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(id);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      return NextResponse.json(
        { error: "Campania nu există." },
        { status: 404 }
      );
    }

    const jobsRef = campaignRef.collection("jobs");

    const [
      queuedCount,
      sendingCount,
      sentCount,
      failedCount,
      skippedCount,
      failedJobsSnap,
      logsSnap,
    ] = await Promise.all([
      jobsRef.where("status", "==", "queued").count().get(),
      jobsRef.where("status", "==", "sending").count().get(),
      jobsRef.where("status", "==", "sent").count().get(),
      jobsRef.where("status", "==", "failed").count().get(),
      jobsRef.where("status", "==", "skipped").count().get(),
      jobsRef.where("status", "==", "failed").limit(20).get(),
      db
        .collection("newsletter_logs")
        .where("campaignId", "==", id)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get(),
    ]);

    const campaign = serializeDoc(campaignSnap);
    const failedJobs = failedJobsSnap.docs.map(serializeDoc).filter(Boolean);
    const logs = logsSnap.docs.map(serializeDoc).filter(Boolean);

    const stats = (
      campaign &&
      typeof campaign === "object" &&
      "stats" in campaign &&
      campaign.stats &&
      typeof campaign.stats === "object"
    ) ?
      (campaign.stats as Record<string, unknown>) :
      {};
    const total = Number(stats.total || 0);
    const sent = Number(stats.sent || 0);
    const failed = Number(stats.failed || 0);
    const deliveryRate = total > 0 ? Number(((sent / total) * 100).toFixed(2)) : 0;
    const errorRate = total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      campaign,
      stats: {
        ...stats,
        deliveryRate,
        errorRate,
      },
      jobsBreakdown: {
        queued: queuedCount.data().count,
        sending: sendingCount.data().count,
        sent: sentCount.data().count,
        failed: failedCount.data().count,
        skipped: skippedCount.data().count,
      },
      failedJobs,
      logs,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/report/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca raportul campaniei." },
      { status: 500 }
    );
  }
}

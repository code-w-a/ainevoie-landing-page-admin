import { NextResponse } from "next/server";
import { devLogServerError } from "@/lib/devServerErrorLog";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();

    const [
      activeSnap,
      unsubscribedSnap,
      bouncedSnap,
      complaintSnap,
      suppressedSnap,
      sentCampaignsSnap,
      sentWithErrorsSnap,
      campaignSnap,
      logSnap,
    ] = await Promise.all([
      db.collection("newsletter_subscribers").where("status", "==", "active").count().get(),
      db.collection("newsletter_subscribers").where("status", "==", "unsubscribed").count().get(),
      db.collection("newsletter_subscribers").where("status", "==", "bounced").count().get(),
      db.collection("newsletter_subscribers").where("status", "==", "complaint").count().get(),
      db.collection("newsletter_subscribers").where("status", "==", "suppressed").count().get(),
      db.collection("newsletter_campaigns").where("status", "==", "sent").count().get(),
      db.collection("newsletter_campaigns").where("status", "==", "sent_with_errors").count().get(),
      db.collection("newsletter_campaigns").orderBy("createdAt", "desc").limit(5).get(),
      db.collection("newsletter_logs").orderBy("createdAt", "desc").limit(5).get(),
    ]);

    const campaigns = campaignSnap.docs.map(serializeDoc).filter(Boolean);
    const logs = logSnap.docs.map(serializeDoc).filter(Boolean);

    return NextResponse.json({
      stats: {
        activeSubscribers: activeSnap.data().count,
        unsubscribed: unsubscribedSnap.data().count,
        bounced: bouncedSnap.data().count,
        complaint: complaintSnap.data().count,
        suppressed: suppressedSnap.data().count,
        campaignsSent: sentCampaignsSnap.data().count,
        campaignsSentWithErrors: sentWithErrorsSnap.data().count,
      },
      campaigns,
      logs,
    });
  } catch (error) {
    devLogServerError("GET /api/admin/newsletter/overview", error);
    return NextResponse.json(
      { error: "Nu am putut încărca sumarul." },
      { status: 500 }
    );
  }
}

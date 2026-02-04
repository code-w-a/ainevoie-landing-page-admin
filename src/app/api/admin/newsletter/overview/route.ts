import { NextResponse } from "next/server";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();

    const [activeSnap, unsubSnap, sentCampaignsSnap, campaignSnap, logSnap] = await Promise.all([
      db.collection("newsletter_subscribers").where("status", "==", "active").count().get(),
      db.collection("newsletter_subscribers").where("status", "==", "unsubscribed").count().get(),
      db.collection("newsletter_campaigns").where("status", "==", "sent").count().get(),
      db.collection("newsletter_campaigns").orderBy("createdAt", "desc").limit(5).get(),
      db.collection("newsletter_logs").orderBy("createdAt", "desc").limit(5).get(),
    ]);

    const campaigns = campaignSnap.docs.map(serializeDoc).filter(Boolean);
    const logs = logSnap.docs.map(serializeDoc).filter(Boolean);

    return NextResponse.json({
      stats: {
        activeSubscribers: activeSnap.data().count,
        unsubscribed: unsubSnap.data().count,
        campaignsSent: sentCampaignsSnap.data().count,
        avgOpenRate: 0,
      },
      campaigns,
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 }
    );
  }
}

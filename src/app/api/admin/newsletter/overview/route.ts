import { NextResponse } from "next/server";
import { devLogServerError } from "@/lib/devServerErrorLog";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { captureServerException } from "@/lib/sentryServer";

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

    const campaigns = campaignSnap.docs.map(serializeDoc).filter(Boolean) as Array<
      Record<string, unknown>
    >;
    const logs = logSnap.docs.map(serializeDoc).filter(Boolean) as Array<
      Record<string, unknown>
    >;

    const campaignNameById = new Map<string, string>();
    for (const campaign of campaigns) {
      const id = typeof campaign.id === "string" ? (campaign.id as string) : "";
      const name =
        (typeof campaign.subject === "string" && (campaign.subject as string).trim()) ||
        (typeof campaign.name === "string" && (campaign.name as string).trim()) ||
        "";
      if (id && name) campaignNameById.set(id, name);
    }

    const missingIds = Array.from(
      new Set(
        logs
          .filter(
            (log) =>
              typeof log.campaignId === "string" &&
              (log.campaignId as string).length > 0 &&
              !(typeof log.campaignName === "string" && (log.campaignName as string).trim()) &&
              !campaignNameById.has(log.campaignId as string)
          )
          .map((log) => log.campaignId as string)
      )
    );

    if (missingIds.length > 0) {
      const refs = missingIds.map((id) =>
        db.collection("newsletter_campaigns").doc(id)
      );
      const docs = await db.getAll(...refs);
      for (const doc of docs) {
        if (!doc.exists) continue;
        const data = doc.data() || {};
        const name =
          (typeof data.subject === "string" && data.subject.trim()) ||
          (typeof data.name === "string" && data.name.trim()) ||
          "";
        if (name) campaignNameById.set(doc.id, name);
      }
    }

    for (const log of logs) {
      if (
        typeof log.campaignId === "string" &&
        !(typeof log.campaignName === "string" && (log.campaignName as string).trim())
      ) {
        const resolved = campaignNameById.get(log.campaignId as string);
        if (resolved) {
          log.campaignName = resolved;
        }
      }
    }

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
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/overview/route.ts" });
    devLogServerError("GET /api/admin/newsletter/overview", error);
    return NextResponse.json(
      { error: "Nu am putut încărca sumarul." },
      { status: 500 }
    );
  }
}

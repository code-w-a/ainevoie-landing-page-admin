import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { parseCallableErrorResponse } from "@/lib/newsletterAdmin";

const region = process.env.FIREBASE_REGION || "europe-west1";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      scheduleAtIso?: string;
      scheduleTimezone?: string;
    };
    const scheduleAtIso =
      typeof body.scheduleAtIso === "string" ? body.scheduleAtIso.trim() : "";

    if (!scheduleAtIso) {
      return NextResponse.json(
        { error: "Lipsește data programării." },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduleAtIso);
    if (Number.isNaN(scheduleDate.getTime())) {
      return NextResponse.json(
        { error: "Data programării este invalidă." },
        { status: 400 }
      );
    }

    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const adminApiKey = process.env.ADMIN_API_KEY;
    const url = `https://${region}-${projectId}.cloudfunctions.net/scheduleNewsletterCampaign`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          campaignId: id,
          scheduleAtIso: scheduleDate.toISOString(),
          scheduleTimezone:
            typeof body.scheduleTimezone === "string" ?
              body.scheduleTimezone :
              "Europe/Bucharest",
          adminApiKey,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: await parseCallableErrorResponse(
            response,
            "Nu am putut programa campania."
          ),
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = (
      data &&
      typeof data === "object" &&
      "result" in data
    ) ?
      (data as {
        result: {
          campaignId?: string;
          status?: string;
          scheduledAt?: string;
          scheduleTaskId?: string;
        };
      }).result :
      (data as {
        campaignId?: string;
        status?: string;
        scheduledAt?: string;
        scheduleTaskId?: string;
      });

    return NextResponse.json({
      campaignId: result?.campaignId || id,
      status: result?.status || "scheduled",
      scheduledAt: result?.scheduledAt || scheduleDate.toISOString(),
      scheduleTaskId: result?.scheduleTaskId || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Nu am putut programa campania." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import {
  parseCallableErrorResponse,
  readCallableErrorMessage,
} from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

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

    const callablePayload = await response.clone().json().catch(() => null);
    const callableError = readCallableErrorMessage(callablePayload);

    if (!response.ok || callableError) {
      return NextResponse.json(
        {
          error:
            callableError ||
            (await parseCallableErrorResponse(
              response,
              "Nu am putut programa campania."
            )),
        },
        { status: response.ok ? 400 : response.status }
      );
    }

    const data = callablePayload ?? (await response.json().catch(() => null));
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

    const resultStatus =
      typeof result?.status === "string" ? result.status.trim() : "";
    if (!resultStatus) {
      return NextResponse.json(
        { error: "Răspuns invalid de la serviciul de programare." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      campaignId: result?.campaignId || id,
      status: resultStatus,
      scheduledAt: result?.scheduledAt || scheduleDate.toISOString(),
      scheduleTaskId: result?.scheduleTaskId || null,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/schedule/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut programa campania." },
      { status: 500 }
    );
  }
}

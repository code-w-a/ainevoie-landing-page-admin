import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { parseCallableErrorResponse } from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

const region = process.env.FIREBASE_REGION || "europe-west1";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const adminApiKey = process.env.ADMIN_API_KEY;
    const url =
      `https://${region}-${projectId}.cloudfunctions.net/unscheduleNewsletterCampaign`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          campaignId: id,
          adminApiKey,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: await parseCallableErrorResponse(
            response,
            "Nu am putut anula programarea campaniei."
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
        };
      }).result :
      (data as {
        campaignId?: string;
        status?: string;
      });

    return NextResponse.json({
      campaignId: result?.campaignId || id,
      status: result?.status || "draft",
    });
  } catch (error) {
    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/unschedule/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut anula programarea campaniei." },
      { status: 500 }
    );
  }
}

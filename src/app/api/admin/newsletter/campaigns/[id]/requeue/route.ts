import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
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

    const url = `https://${region}-${projectId}.cloudfunctions.net/requeueFailedJobs`;
    const payload = {
      data: {
        campaignId: id,
        adminApiKey,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: await parseCallableErrorResponse(
            response,
            "Nu am putut recoada joburile eșuate."
          ),
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/requeue/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut recoada joburile eșuate." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

const region = process.env.FIREBASE_REGION || "europe-west1";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const adminApiKey = process.env.ADMIN_API_KEY;

    const url = `https://${region}-${projectId}.cloudfunctions.net/requeueFailedJobs`;
    const payload = {
      data: {
        campaignId: params.id,
        adminApiKey,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || "Failed to requeue jobs" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to requeue jobs" },
      { status: 500 }
    );
  }
}

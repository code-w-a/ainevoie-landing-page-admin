import { NextResponse } from "next/server";
import { devLogServerError } from "@/lib/devServerErrorLog";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { captureServerException } from "@/lib/sentryServer";

const MAX_SUBSCRIBERS = 20;
const MAX_PROVIDERS = 20;

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();

    const [subscriberSnap, providerSnap] = await Promise.all([
      db
        .collection("newsletter_subscribers")
        .orderBy("createdAt", "desc")
        .limit(MAX_SUBSCRIBERS)
        .get(),
      db
        .collection("providers")
        .orderBy("createdAt", "desc")
        .limit(MAX_PROVIDERS)
        .get(),
    ]);

    const newSubscribers = subscriberSnap.docs.map(serializeDoc).filter(Boolean);
    const newProviders = providerSnap.docs.map(serializeDoc).filter(Boolean);

    return NextResponse.json({ newSubscribers, newProviders });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/recent-activity/route.ts" });
    devLogServerError("GET /api/admin/newsletter/recent-activity", error);
    return NextResponse.json(
      { error: "Nu am putut încărca înregistrările recente." },
      { status: 500 }
    );
  }
}

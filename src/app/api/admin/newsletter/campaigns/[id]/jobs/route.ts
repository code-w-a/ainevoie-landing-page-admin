import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { captureServerException } from "@/lib/sentryServer";

const DEFAULT_LIMIT = 100;
const MIN_LIMIT = 1;
const MAX_LIMIT = 200;

function parseLimit(raw: string | null): number {
  if (!raw) {
    return DEFAULT_LIMIT;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < MIN_LIMIT) {
    return MIN_LIMIT;
  }
  return Math.min(MAX_LIMIT, n);
}

function readCursor(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id: campaignId } = await context.params;
    const db = getAdminDb();
    const campaignRef = db.collection("newsletter_campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      return NextResponse.json({ error: "Campania nu există." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const cursor = readCursor(searchParams.get("cursor"));

    const jobsRef = campaignRef.collection("jobs");
    let query = jobsRef.orderBy(FieldPath.documentId()).limit(limit + 1);
    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    const items = pageDocs.map((doc) => serializeDoc(doc)).filter(Boolean);
    const lastDoc = pageDocs[pageDocs.length - 1];
    const nextCursor = hasMore && lastDoc ? lastDoc.id : null;

    return NextResponse.json({
      items,
      nextCursor,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/jobs/GET" });
    return NextResponse.json(
      { error: "Nu am putut încărca joburile campaniei." },
      { status: 500 }
    );
  }
}

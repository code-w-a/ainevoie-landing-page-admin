import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(request: Request) {
  try {
    const decoded = await requireAdmin(request);
    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
    });
  } catch (error) {
    captureServerException(error, { route: "api/admin/auth/session/route.ts" });
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
}

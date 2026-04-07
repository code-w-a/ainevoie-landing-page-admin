import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    const decoded = await requireAdmin(request);
    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
}

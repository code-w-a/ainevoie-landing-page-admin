import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    const decoded = await requireAdmin(request);
    return NextResponse.json({ uid: decoded.uid, email: decoded.email });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

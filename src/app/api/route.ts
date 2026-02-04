import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.json(
    { error: "Auth is disabled (Prisma removed)." },
    { status: 501 }
  );
}

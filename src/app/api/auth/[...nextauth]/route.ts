import { NextResponse } from "next/server";

function notAvailable() {
  return NextResponse.json(
    { error: "Auth is disabled (Prisma removed)." },
    { status: 501 }
  );
}

export const GET = async () => notAvailable();
export const POST = async () => notAvailable();


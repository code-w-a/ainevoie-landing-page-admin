import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password reset is disabled (Prisma removed)." },
    { status: 501 }
  );
}

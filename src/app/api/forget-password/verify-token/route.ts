import { NextResponse } from "next/server";

export const POST = async () => {
  return NextResponse.json(
    { error: "Password reset is disabled (Prisma removed)." },
    { status: 501 }
  );
};

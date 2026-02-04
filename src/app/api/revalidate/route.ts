import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Revalidate disabled (Sanity removed)." },
    { status: 410 }
  );
}

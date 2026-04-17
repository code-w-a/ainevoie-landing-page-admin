import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("This is a test error from /api/sentry-example-api");
}

export async function POST() {
  return NextResponse.json({ ok: true });
}

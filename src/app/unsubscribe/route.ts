import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return new NextResponse("Token lipsă.", { status: 400 });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return new NextResponse("FIREBASE_PROJECT_ID lipsă.", { status: 500 });
  }
  const region = process.env.FIREBASE_REGION || "europe-west1";
  const targetUrl = `https://${region}-${projectId}.cloudfunctions.net/unsubscribe?token=${encodeURIComponent(
    token
  )}`;

  const response = await fetch(targetUrl, { method: "GET" });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "text/html",
    },
  });
}

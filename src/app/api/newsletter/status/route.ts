import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

function normalizeEmail(value?: string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value: string) {
  return value.includes("@");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const normalizedEmail = normalizeEmail(searchParams.get("email"));

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    let existingSnap = await db
      .collection("newsletter_subscribers")
      .where("emailNormalized", "==", normalizedEmail)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      existingSnap = await db
        .collection("newsletter_subscribers")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();
    }

    const isActiveSubscriber =
      !existingSnap.empty && existingSnap.docs[0].get("status") === "active";

    return NextResponse.json({ isActiveSubscriber }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check newsletter status" },
      { status: 500 }
    );
  }
}

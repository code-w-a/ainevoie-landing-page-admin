import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  // Minimal email sanity check.
  if (!normalizedEmail.includes("@")) {
    return NextResponse.json(
      { error: "Invalid email" },
      { status: 400 },
    );
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

    if (!existingSnap.empty) {
      const docRef = existingSnap.docs[0].ref;
      await docRef.update({
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        status: "active",
        source: "landing",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ status: "already_subscribed" }, { status: 200 });
    }

    await db.collection("newsletter_subscribers").add({
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      status: "active",
      tags: [],
      source: "landing",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ status: "subscribed" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

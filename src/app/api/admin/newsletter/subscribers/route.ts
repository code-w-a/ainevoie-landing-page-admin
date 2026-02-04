import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

const ALLOWED_SORTS: Record<string, string> = {
  createdAt: "createdAt",
  email: "email",
  status: "status",
};

function parseCursor(cursor: string, field: string) {
  if (field === "createdAt") {
    const parsed = new Date(cursor);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return cursor;
}

function serializeCursor(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as FirebaseFirestore.Timestamp).toDate().toISOString();
  }
  return value ?? null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 100);
    const cursor = searchParams.get("cursor");
    const status = searchParams.get("status");
    const sortByKey = searchParams.get("sortBy") || "createdAt";
    const sortField = ALLOWED_SORTS[sortByKey] || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection("newsletter_subscribers")
      .orderBy(sortField, sortDir)
      .limit(limit);

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    if (cursor) {
      const parsedCursor = parseCursor(cursor, sortField);
      if (parsedCursor !== null) {
        query = query.startAfter(parsedCursor);
      }
    }

    const snapshot = await query.get();

    const items = snapshot.docs.map(serializeDoc).filter(Boolean);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? serializeCursor(lastDoc.get(sortField)) : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load subscribers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const normalizedEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const db = getAdminDb();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

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
        status: body.status || "active",
        tags: Array.isArray(body.tags) ? body.tags : [],
        source: body.source || "admin",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ id: docRef.id, status: "already_exists" });
    }

    const docRef = await db.collection("newsletter_subscribers").add({
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      status: body.status || "active",
      tags: Array.isArray(body.tags) ? body.tags : [],
      source: body.source || "admin",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create subscriber" },
      { status: 500 }
    );
  }
}

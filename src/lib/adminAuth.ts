import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw new Error("missing_token");
  }

  const db = getAdminDb();
  const decoded = await getAuth().verifyIdToken(token);
  const adminDoc = await db.collection("admini").doc(decoded.uid).get();

  if (!adminDoc.exists) {
    throw new Error("not_admin");
  }

  const data = adminDoc.data();
  if (!data?.isAdmin) {
    throw new Error("not_admin");
  }

  return decoded;
}

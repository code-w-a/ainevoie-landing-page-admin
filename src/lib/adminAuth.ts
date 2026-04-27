import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    console.warn("[admin-auth] missing bearer token");
    throw new Error("missing_token");
  }

  const db = getAdminDb();
  const decoded = await getAuth().verifyIdToken(token);
  console.info("[admin-auth] decoded token", {
    uid: decoded.uid,
    email: decoded.email,
  });

  const adminDoc = await db.collection("admini").doc(decoded.uid).get();

  if (!adminDoc.exists) {
    console.warn("[admin-auth] admin document missing", { uid: decoded.uid });
    throw new Error("not_admin");
  }

  const data = adminDoc.data();
  if (!data?.isAdmin) {
    console.warn("[admin-auth] admin document does not grant access", {
      uid: decoded.uid,
      isAdmin: data?.isAdmin,
    });
    throw new Error("not_admin");
  }

  console.info("[admin-auth] admin access granted", { uid: decoded.uid });
  return Object.assign(decoded, { idToken: token });
}

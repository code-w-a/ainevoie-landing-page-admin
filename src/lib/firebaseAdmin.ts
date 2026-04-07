import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-side Firestore uses the service account from FIREBASE_PROJECT_ID,
 * FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (same JSON as on Vercel).
 * If Firestore returns UNAUTHENTICATED locally, the private key or project id is wrong or truncated in .env.local.
 */
function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    return undefined;
  }
  return key.replace(/\\n/g, "\n");
}

export function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  }

  return getFirestore();
}

export function serializeDoc(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data();
  if (!data) {
    return null;
  }
  const serialized: Record<string, unknown> = { id: doc.id };
  Object.entries(data).forEach(([key, value]) => {
    if (value && typeof value === "object" && "toDate" in value) {
      serialized[key] = (value as FirebaseFirestore.Timestamp).toDate().toISOString();
      return;
    }
    serialized[key] = value;
  });
  return serialized;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

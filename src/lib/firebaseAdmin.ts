import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

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

function getAdminApp() {
  if (!getApps().length) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return getApps()[0];
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorageBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const storage = getStorage(getAdminApp());
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
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

import type { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export type AdminAuthErrorCode = "missing_token" | "invalid_token" | "not_admin";

export class AdminAuthError extends Error {
  readonly code: AdminAuthErrorCode;
  readonly status: 401 | 403;

  constructor(code: AdminAuthErrorCode, status: 401 | 403, message?: string) {
    super(message || code);
    this.name = "AdminAuthError";
    this.code = code;
    this.status = status;
  }
}

export type AdminAccessLevel = "admin" | "support";

export type AdminSession = DecodedIdToken & {
  idToken: string;
  adminAccessLevel: AdminAccessLevel;
  adminAccessSource: "firestore" | "dev_allowlist";
};

function readBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

function readDevAdminAllowlist() {
  if (process.env.NODE_ENV === "production") {
    return new Set<string>();
  }

  const raw =
    process.env.ADMIN_EMAIL_ALLOWLIST ||
    process.env.NEXT_ADMIN_EMAIL_ALLOWLIST ||
    "";

  return new Set(
    raw
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function hasDevAdminAccess(decoded: DecodedIdToken) {
  const email = decoded.email?.trim().toLowerCase();
  return Boolean(email && readDevAdminAllowlist().has(email));
}

function readFirestoreAccessLevel(
  data: FirebaseFirestore.DocumentData | undefined,
  allowSupport: boolean
): AdminAccessLevel | null {
  if (data?.isAdmin === true || data?.role === "admin") {
    return "admin";
  }

  if (allowSupport && (data?.isSupport === true || data?.role === "support")) {
    return "support";
  }

  return null;
}

async function verifyToken(token: string) {
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (error) {
    console.warn("[admin-auth] invalid bearer token", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new AdminAuthError("invalid_token", 401);
  }
}

async function requireAdminAccess(
  request: Request,
  options: { allowSupport: boolean }
): Promise<AdminSession> {
  const token = readBearerToken(request);
  if (!token) {
    console.warn("[admin-auth] missing bearer token");
    throw new AdminAuthError("missing_token", 401);
  }

  const decoded = await verifyToken(token);
  console.info("[admin-auth] decoded token", {
    uid: decoded.uid,
    email: decoded.email,
  });

  if (hasDevAdminAccess(decoded)) {
    console.info("[admin-auth] dev allowlist access granted", {
      uid: decoded.uid,
      email: decoded.email,
    });
    return Object.assign(decoded, {
      idToken: token,
      adminAccessLevel: "admin" as const,
      adminAccessSource: "dev_allowlist" as const,
    });
  }

  const db = getAdminDb();
  const adminDoc = await db.collection("admini").doc(decoded.uid).get();

  if (!adminDoc.exists) {
    console.warn("[admin-auth] admin document missing", { uid: decoded.uid });
    throw new AdminAuthError("not_admin", 403);
  }

  const data = adminDoc.data();
  const accessLevel = readFirestoreAccessLevel(data, options.allowSupport);
  if (!accessLevel) {
    console.warn("[admin-auth] admin document does not grant access", {
      uid: decoded.uid,
      isAdmin: data?.isAdmin,
      isSupport: data?.isSupport,
      role: data?.role,
    });
    throw new AdminAuthError("not_admin", 403);
  }

  console.info("[admin-auth] admin access granted", {
    uid: decoded.uid,
    accessLevel,
  });
  return Object.assign(decoded, {
    idToken: token,
    adminAccessLevel: accessLevel,
    adminAccessSource: "firestore" as const,
  });
}

export async function requireAdmin(request: Request) {
  return requireAdminAccess(request, { allowSupport: false });
}

export async function requireAdminOrSupport(request: Request) {
  return requireAdminAccess(request, { allowSupport: true });
}

export function isAdminAuthError(error: unknown): error is AdminAuthError {
  return error instanceof AdminAuthError;
}

export function adminAuthErrorResponse(error: unknown) {
  if (!isAdminAuthError(error)) {
    return null;
  }

  const message =
    error.code === "not_admin"
      ? "Nu ai drepturi de administrator pentru acest cont."
      : "Neautorizat.";

  return NextResponse.json(
    {
      error: message,
      code: error.code,
    },
    { status: error.status }
  );
}

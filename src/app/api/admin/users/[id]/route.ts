import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { getAdminUserCaseFallback } from "@/lib/adminUsersFallback";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

function sanitizeRole(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isPrivilegedAccount(data: Record<string, unknown> | null | undefined) {
  if (!data) {
    return false;
  }

  const role = sanitizeRole(data.role);
  return Boolean(data.isAdmin) || Boolean(data.isSupport) || role === "admin" || role === "support";
}

function createRouteError(message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

async function deleteUserViaFirestoreFallback(userId: string) {
  const db = getAdminDb();
  const auth = getAdminAuth();

  const [adminSnap, userSnap] = await Promise.all([
    db.collection("admini").doc(userId).get(),
    db.collection("users").doc(userId).get(),
  ]);

  if (isPrivilegedAccount(adminSnap.data() as Record<string, unknown> | undefined)) {
    throw createRouteError("Nu poți șterge conturi de admin/support.", 412);
  }
  if (isPrivilegedAccount(userSnap.data() as Record<string, unknown> | undefined)) {
    throw createRouteError("Nu poți șterge conturi de admin/support.", 412);
  }

  await Promise.all([
    db.collection("users").doc(userId).delete().catch(() => undefined),
    db.collection("providers").doc(userId).delete().catch(() => undefined),
    db.collection("providerDirectory").doc(userId).delete().catch(() => undefined),
  ]);

  try {
    await auth.deleteUser(userId);
  } catch (error) {
    const code = String((error as { code?: unknown })?.code || "");
    if (code !== "auth/user-not-found") {
      throw error;
    }
  }

  return {
    userId,
    deleted: true,
    fallback: true,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { id } = await context.params;

    console.info("[admin-user-case] detail request", {
      adminUid: admin.uid,
      userId: id,
    });

    let result: unknown;
    try {
      result = await callAdminCallable(
        "getAdminUserCase",
        {
          userId: id,
        },
        "Nu am putut încărca utilizatorul.",
        admin.idToken
      );
    } catch (error) {
      if (error instanceof AdminCallableError && error.status === 404) {
        console.warn("[admin-user-case] callable missing, using firestore fallback");
        result = await getAdminUserCaseFallback(id);
      } else {
        throw error;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      console.error("[admin-user-case] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && "status" in error && typeof (error as { status?: unknown }).status === "number") {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }

    console.error("[admin-user-case] route error", error);
    captureServerException(error, { route: "api/admin/users/[id]/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca utilizatorul." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const userId = decodeURIComponent(String(id || "")).trim();

    if (!userId) {
      return NextResponse.json({ error: "User id este obligatoriu." }, { status: 400 });
    }

    let result: unknown;
    try {
      result = await callAdminCallable(
        "adminDeleteUser",
        {
          userId,
          adminUid: admin.uid,
        },
        "Nu am putut șterge utilizatorul.",
        admin.idToken
      );
    } catch (error) {
      if (error instanceof AdminCallableError && error.status === 404) {
        console.warn("[admin-user-delete] callable missing, using firestore fallback", { userId });
        result = await deleteUserViaFirestoreFallback(userId);
      } else {
        throw error;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && "status" in error && typeof (error as { status?: unknown }).status === "number") {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }

    captureServerException(error, { route: "api/admin/users/[id]/route.ts:DELETE" });
    return NextResponse.json(
      { error: "Nu am putut șterge utilizatorul." },
      { status: 500 }
    );
  }
}

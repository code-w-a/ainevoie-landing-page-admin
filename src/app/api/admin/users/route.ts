import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { listAdminUsersFallback } from "@/lib/adminUsersFallback";
import { captureServerException } from "@/lib/sentryServer";

function readPositiveNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const filters = {
      limit: readPositiveNumber(searchParams.get("limit"), 50, 100),
      search: searchParams.get("q")?.trim() || undefined,
    };

    console.info("[admin-users] list request", {
      adminUid: admin.uid,
      filters,
    });

    let result: unknown;
    try {
      result = await callAdminCallable(
        "listAdminUsers",
        filters,
        "Nu am putut încărca utilizatorii.",
        admin.idToken
      );
    } catch (error) {
      if (error instanceof AdminCallableError && error.status === 404) {
        console.warn("[admin-users] callable missing, using firestore fallback");
        result = await listAdminUsersFallback({
          limit: filters.limit,
          search: filters.search,
        });
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
      console.error("[admin-users] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin-users] route error", error);
    captureServerException(error, { route: "api/admin/users/route.ts" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca utilizatorii." },
      { status: 500 }
    );
  }
}

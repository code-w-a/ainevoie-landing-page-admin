import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

type LookupItem = {
  id: string;
  primaryText: string;
  secondaryText: string | null;
  secondaryId: string | null;
  entityType: "user" | "provider" | "admin" | "booking" | "supportTicket";
};

type LookupResponse = {
  items?: LookupItem[];
};

function readLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 8;
  }
  return Math.min(20, Math.max(1, Math.floor(parsed)));
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const id = searchParams.get("id")?.trim() || "";
    const ids = searchParams.getAll("ids").map((entry) => entry.trim()).filter(Boolean);

    if (q.length < 2 && !id && !ids.length) {
      return NextResponse.json({ items: [] });
    }

    const result = await callAdminCallable<LookupResponse>(
      "adminLookupEntities",
      {
        q,
        id: id || undefined,
        ids: ids.length ? ids : undefined,
        entityType: searchParams.get("entityType")?.trim() || undefined,
        limit: readLimit(searchParams.get("limit")),
      },
      "Nu am putut încărca sugestiile de lookup.",
      admin.idToken
    );

    return NextResponse.json({ items: Array.isArray(result?.items) ? result.items : [] });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/lookups/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca sugestiile de lookup." },
      { status: 500 }
    );
  }
}

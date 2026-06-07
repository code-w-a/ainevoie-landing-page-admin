import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

const DOCUMENT_TYPES = ["identity", "professional"] as const;
const REVIEW_ACTIONS = ["approve", "reject"] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number];
type ReviewAction = (typeof REVIEW_ACTIONS)[number];

function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === "string" && DOCUMENT_TYPES.includes(value as DocumentType);
}

function isReviewAction(value: unknown): value is ReviewAction {
  return typeof value === "string" && REVIEW_ACTIONS.includes(value as ReviewAction);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentType: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id, documentType: rawDocumentType } = await context.params;
    const providerId = decodeURIComponent(String(id || "")).trim();
    const documentType = decodeURIComponent(String(rawDocumentType || "")).trim();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!providerId) {
      return NextResponse.json({ error: "Provider id este obligatoriu." }, { status: 400 });
    }

    if (!isDocumentType(documentType)) {
      return NextResponse.json({ error: "Tip document nevalid." }, { status: 400 });
    }

    if (!isReviewAction(action)) {
      return NextResponse.json({ error: "Acțiune nevalidă." }, { status: 400 });
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Motivul este obligatoriu pentru respingerea documentului." },
        { status: 400 }
      );
    }

    const result = await callAdminCallable(
      "adminReviewProviderDocument",
      {
        providerId,
        documentType,
        action,
        reason: reason || undefined,
        adminUid: admin.uid,
      },
      "Nu am putut procesa documentul prestatorului.",
      admin.idToken
    );

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, {
      route: "api/admin/providers/[id]/documents/[documentType]/review/route.ts:POST",
    });
    return NextResponse.json(
      { error: "Nu am putut procesa documentul prestatorului." },
      { status: 500 }
    );
  }
}

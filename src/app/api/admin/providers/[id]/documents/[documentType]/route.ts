import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

const DOCUMENT_TYPES = ["identity", "professional"] as const;
type DocumentType = (typeof DOCUMENT_TYPES)[number];

function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}

function sanitizeFileName(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  return value.trim().replace(/[^\w.\- ]+/g, "_");
}

function readDocument(
  provider: FirebaseFirestore.DocumentData,
  documentType: DocumentType
) {
  const document = provider.documents?.[documentType];
  if (!document || typeof document !== "object") {
    return null;
  }
  return document as {
    status?: string | null;
    storagePath?: string | null;
    originalFileName?: string | null;
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; documentType: string }> }
) {
  try {
    await requireAdminOrSupport(request);
    const { id, documentType } = await context.params;

    if (!isDocumentType(documentType)) {
      return NextResponse.json({ error: "Tip document nevalid." }, { status: 400 });
    }

    const providerSnap = await getAdminDb().collection("providers").doc(id).get();
    if (!providerSnap.exists) {
      return NextResponse.json({ error: "Prestatorul nu există." }, { status: 404 });
    }

    const document = readDocument(providerSnap.data() || {}, documentType);
    const storagePath = document?.storagePath?.trim() || "";
    const allowedPrefix = `providers/${id}/documents/${documentType}/`;

    if (
      !document ||
      !["uploaded", "approved"].includes(String(document.status || "")) ||
      !storagePath ||
      !storagePath.startsWith(allowedPrefix) ||
      storagePath.includes("..")
    ) {
      return NextResponse.json(
        { error: "Documentul nu poate fi încărcat." },
        { status: 404 }
      );
    }

    const file = getAdminStorageBucket().file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { error: "Documentul nu poate fi încărcat." },
        { status: 404 }
      );
    }

    const [[buffer], [metadata]] = await Promise.all([
      file.download(),
      file.getMetadata(),
    ]);
    const contentType = metadata.contentType || "application/octet-stream";
    const fileName = sanitizeFileName(
      document.originalFileName,
      `${documentType}-${id}`
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    console.error("[admin-provider-document] route error", error);
    captureServerException(error, {
      route: "api/admin/providers/[id]/documents/[documentType]/route.ts",
    });
    return NextResponse.json(
      { error: "Documentul nu poate fi încărcat." },
      { status: 500 }
    );
  }
}

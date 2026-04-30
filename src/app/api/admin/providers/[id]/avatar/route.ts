import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

function readAvatarPath(provider: FirebaseFirestore.DocumentData) {
  const avatarPath = provider.professionalProfile?.avatarPath;
  return typeof avatarPath === "string" ? avatarPath.trim() : "";
}

function sanitizeFileName(value: string) {
  return value.trim().replace(/[^\w.\- ]+/g, "_") || "provider";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrSupport(request);
    const { id } = await context.params;

    const providerSnap = await getAdminDb().collection("providers").doc(id).get();
    if (!providerSnap.exists) {
      return NextResponse.json({ error: "Prestatorul nu există." }, { status: 404 });
    }

    const avatarPath = readAvatarPath(providerSnap.data() || {});
    const allowedPrefix = `providers/${id}/avatar/`;

    if (!avatarPath || !avatarPath.startsWith(allowedPrefix) || avatarPath.includes("..")) {
      return NextResponse.json(
        { error: "Imaginea de profil nu poate fi încărcată." },
        { status: 404 }
      );
    }

    const file = getAdminStorageBucket().file(avatarPath);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { error: "Imaginea de profil nu poate fi încărcată." },
        { status: 404 }
      );
    }

    const [[buffer], [metadata]] = await Promise.all([
      file.download(),
      file.getMetadata(),
    ]);
    const contentType = metadata.contentType || "application/octet-stream";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="avatar-${sanitizeFileName(id)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    console.error("[admin-provider-avatar] route error", error);
    captureServerException(error, {
      route: "api/admin/providers/[id]/avatar/route.ts",
    });
    return NextResponse.json(
      { error: "Imaginea de profil nu poate fi încărcată." },
      { status: 500 }
    );
  }
}

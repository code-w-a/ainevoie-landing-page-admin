import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

type UserStatePayload = {
  action?: "disable" | "enable";
  reason?: string;
  note?: string;
  resolutionStatus?: "open" | "in_progress" | "resolved";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const userId = decodeURIComponent(String(id || "")).trim();
    const body = (await request.json().catch(() => ({}))) as UserStatePayload;

    if (!userId) {
      return NextResponse.json({ error: "User id este obligatoriu." }, { status: 400 });
    }

    const result = await callAdminCallable(
      "adminUpdateUserState",
      {
        userId,
        action: body.action,
        reason: body.reason,
        note: body.note,
        resolutionStatus: body.resolutionStatus,
      },
      "Nu am putut actualiza starea utilizatorului.",
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

    captureServerException(error, { route: "api/admin/users/[id]/state/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza starea utilizatorului." },
      { status: 500 }
    );
  }
}

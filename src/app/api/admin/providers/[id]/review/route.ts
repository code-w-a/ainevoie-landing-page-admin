import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/emailTemplates/adminEmailTemplates";
import { getEmailTemplateConfig } from "@/lib/emailTemplates/adminEmailTemplatesServer";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

const REVIEW_ACTIONS = ["approve", "reject", "suspend", "reinstate"] as const;
type ReviewAction = (typeof REVIEW_ACTIONS)[number];

function isReviewAction(value: unknown): value is ReviewAction {
  return typeof value === "string" && REVIEW_ACTIONS.includes(value as ReviewAction);
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveProviderLocale(value: unknown): "ro" | "en" {
  return value === "en" ? "en" : "ro";
}

async function trySendProviderApprovedEmail(providerId: string) {
  try {
    const providerSnap = await getAdminDb().collection("providers").doc(providerId).get();
    const providerData = providerSnap.exists ? providerSnap.data() || {} : null;

    if (!providerData) {
      console.warn("[admin-provider-review] provider approved email skipped: provider missing", {
        providerId,
      });
      return;
    }

    const providerEmail = sanitizeText(providerData.email).toLowerCase();

    if (!providerEmail || !providerEmail.includes("@")) {
      console.warn("[admin-provider-review] provider approved email skipped: invalid email", {
        providerId,
      });
      return;
    }

    const providerName =
      sanitizeText(providerData.professionalProfile?.displayName)
      || sanitizeText(providerData.fullName)
      || "Prestator";
    const locale = resolveProviderLocale(providerData.locale);
    const config = await getEmailTemplateConfig();
    const rendered = renderTemplate({
      kind: "providerApproved",
      locale,
      config,
      vars: {
        fullName: providerName,
        email: providerEmail,
      },
    });

    await sendEmail({
      to: providerEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    console.info("[admin-provider-review] provider approved email sent", {
      providerId,
      locale,
      to: providerEmail,
    });
  } catch (error) {
    console.error("[admin-provider-review] provider approved email failed", {
      providerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    console.info("[admin-provider-review] review request", {
      adminUid: admin.uid,
      providerId: id,
      action,
      hasReason: Boolean(reason),
    });

    if (!isReviewAction(action)) {
      console.warn("[admin-provider-review] invalid action", {
        providerId: id,
        action,
      });
      return NextResponse.json({ error: "Acțiune nevalidă." }, { status: 400 });
    }

    if ((action === "reject" || action === "suspend") && !reason) {
      console.warn("[admin-provider-review] missing reason", {
        providerId: id,
        action,
      });
      return NextResponse.json(
        { error: "Motivul este obligatoriu pentru respingere sau suspendare." },
        { status: 400 }
      );
    }

    const result = await callAdminCallable(
      "adminReviewProvider",
      {
        providerId: id,
        action,
        reason: reason || undefined,
        adminUid: admin.uid,
      },
      "Nu am putut procesa decizia pentru prestator.",
      admin.idToken
    );

    const resultStatus = sanitizeText((result as Record<string, unknown>)?.status);
    if (action === "approve" && resultStatus === "approved") {
      await trySendProviderApprovedEmail(id);
    }

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      console.error("[admin-provider-review] callable error", {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin-provider-review] route error", error);
    captureServerException(error, { route: "api/admin/providers/[id]/review/route.ts" });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut procesa decizia pentru prestator.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/emailTemplates/adminEmailTemplates";
import { getEmailTemplateConfig } from "@/lib/emailTemplates/adminEmailTemplatesServer";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
const ROUTE_TAG = "[admin-provider-review]";

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

async function trySendProviderApprovedEmail({
  providerId,
  reviewCorrelationId,
  action,
  statusTo,
}: {
  providerId: string;
  reviewCorrelationId: string;
  action: ReviewAction;
  statusTo: string;
}) {
  try {
    const providerSnap = await getAdminDb().collection("providers").doc(providerId).get();
    const providerData = providerSnap.exists ? providerSnap.data() || {} : null;
    const statusFrom = sanitizeText(providerData?.status);

    if (!providerData) {
      console.warn(`${ROUTE_TAG} provider_approved_email_skipped_provider_missing`, {
        reviewCorrelationId,
        providerId,
      });
      return;
    }

    const providerEmail = sanitizeText(providerData.email).toLowerCase();

    if (!providerEmail || !providerEmail.includes("@")) {
      console.warn(`${ROUTE_TAG} provider_approved_email_skipped_invalid_email`, {
        reviewCorrelationId,
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

    console.info(`${ROUTE_TAG} provider_approved_email_send_attempt`, {
      reviewCorrelationId,
      providerId,
      action,
      statusFrom,
      statusTo,
      locale,
    });

    await sendEmail({
      to: providerEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    }, {
      channel: "provider_approved",
      templateKind: "providerApproved",
      requestId: reviewCorrelationId,
      correlationId: reviewCorrelationId,
      route: "api/admin/providers/[id]/review",
      providerId,
      action,
      statusFrom,
      statusTo,
    });

    console.info(`${ROUTE_TAG} provider_approved_email_sent`, {
      reviewCorrelationId,
      providerId,
      locale,
    });
  } catch (error) {
    console.error(`${ROUTE_TAG} provider_approved_email_failed`, {
      reviewCorrelationId,
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
    const reviewCorrelationId = randomUUID();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    console.info(`${ROUTE_TAG} review_request`, {
      reviewCorrelationId,
      adminUid: admin.uid,
      providerId: id,
      action,
      hasReason: Boolean(reason),
    });

    if (!isReviewAction(action)) {
      console.warn(`${ROUTE_TAG} review_invalid_action`, {
        reviewCorrelationId,
        providerId: id,
        action,
      });
      return NextResponse.json({ error: "Acțiune nevalidă." }, { status: 400 });
    }

    if ((action === "reject" || action === "suspend") && !reason) {
      console.warn(`${ROUTE_TAG} review_missing_reason`, {
        reviewCorrelationId,
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
        reviewCorrelationId,
      },
      "Nu am putut procesa decizia pentru prestator.",
      admin.idToken
    );

    const resultStatus = sanitizeText((result as Record<string, unknown>)?.status);
    console.info(`${ROUTE_TAG} review_result`, {
      reviewCorrelationId,
      providerId: id,
      action,
      statusTo: resultStatus || null,
    });

    if (action === "approve" && resultStatus === "approved") {
      await trySendProviderApprovedEmail({
        providerId: id,
        reviewCorrelationId,
        action,
        statusTo: resultStatus,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminCallableError) {
      console.error(`${ROUTE_TAG} review_callable_error`, {
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(`${ROUTE_TAG} review_route_error`, error);
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

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { isProviderStatus } from "@/lib/providers";
import { captureServerException } from "@/lib/sentryServer";
import { sendEmail } from "@/lib/email";
import type { AppLocale } from "@/lib/apiLocale";
import { renderTemplate } from "@/lib/emailTemplates/adminEmailTemplates";
import { getEmailTemplateConfig } from "@/lib/emailTemplates/adminEmailTemplatesServer";

const SYSTEM_ACTOR_LABELS: Record<string, string> = {
  system_onboarding: "Sistem (onboarding public)",
  system: "Sistem",
};

async function resolveActorLabels(
  uids: string[]
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (uids.length === 0) return labels;

  const lookups = uids.map((uid) => ({ uid }));
  const chunks: Array<typeof lookups> = [];
  for (let i = 0; i < lookups.length; i += 100) {
    chunks.push(lookups.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const result = await getAuth().getUsers(chunk);
      for (const user of result.users) {
        const label =
          (user.displayName && user.displayName.trim()) ||
          (user.email && user.email.trim()) ||
          "";
        if (label) labels.set(user.uid, label);
      }
    } catch {
      // swallow: unresolved UIDs will fall back to truncated ID
    }
  }
  return labels;
}

type UpdatePayload = {
  onboardingStatus?: string;
  internalNotes?: string;
};

type ApprovalEmailResult = {
  sent: boolean;
  errorMessage?: string;
};

function resolveProviderLocale(value: unknown): AppLocale {
  return value === "en" ? "en" : "ro";
}

async function sendProviderApprovalEmail(params: {
  email: string;
  fullName: string;
  locale: AppLocale;
}): Promise<ApprovalEmailResult> {
  const { email, fullName, locale } = params;
  try {
    const config = await getEmailTemplateConfig();
    const rendered = renderTemplate({
      kind: "providerApproved",
      locale,
      config,
      vars: { fullName, email },
    });
    await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    return { sent: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "approval_email_failed";
    return { sent: false, errorMessage };
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    const doc = await db.collection("providers").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Prestatorul nu a fost găsit." }, { status: 404 });
    }

    const eventsSnapshot = await db
      .collection("providers")
      .doc(id)
      .collection("events")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const events = eventsSnapshot.docs
      .map(serializeDoc)
      .filter(Boolean) as Array<Record<string, unknown>>;

    const uidsToResolve = Array.from(
      new Set(
        events
          .map((event) => event.actorUid)
          .filter(
            (uid): uid is string =>
              typeof uid === "string" && uid.length > 0 && !(uid in SYSTEM_ACTOR_LABELS)
          )
      )
    );
    const actorLabels = await resolveActorLabels(uidsToResolve);

    for (const event of events) {
      const uid = typeof event.actorUid === "string" ? event.actorUid : "";
      if (!uid) continue;
      if (SYSTEM_ACTOR_LABELS[uid]) {
        event.actorLabel = SYSTEM_ACTOR_LABELS[uid];
      } else if (actorLabels.has(uid)) {
        event.actorLabel = actorLabels.get(uid);
      }
    }

    return NextResponse.json({ item: serializeDoc(doc), events });
  } catch (error) {
    captureServerException(error, { route: "api/admin/providers/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca prestatorul." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as UpdatePayload;
    const db = getAdminDb();
    const docRef = db.collection("providers").doc(id);
    const existingDoc = await docRef.get();
    const existingData = existingDoc.data() as
      | {
          onboardingStatus?: string;
          email?: string;
          fullName?: string;
          locale?: string;
        }
      | undefined;
    const previousStatus = existingData?.onboardingStatus || "new";

    const payload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    let nextStatus: string | null = null;

    if (typeof body.onboardingStatus === "string") {
      const normalized = body.onboardingStatus.trim().toLowerCase();
      if (!isProviderStatus(normalized)) {
        return NextResponse.json({ error: "Status nevalid." }, { status: 400 });
      }
      payload.onboardingStatus = normalized;
      nextStatus = normalized;
    }

    if (typeof body.internalNotes === "string") {
      payload.internalNotes = body.internalNotes.trim();
    }

    await docRef.set(payload, { merge: true });

    let approvalEmail: ApprovalEmailResult | null = null;
    if (
      nextStatus === "approved" &&
      previousStatus !== "approved" &&
      typeof existingData?.email === "string" &&
      existingData.email.includes("@")
    ) {
      approvalEmail = await sendProviderApprovalEmail({
        email: existingData.email,
        fullName:
          typeof existingData.fullName === "string" && existingData.fullName.trim()
            ? existingData.fullName.trim()
            : existingData.email,
        locale: resolveProviderLocale(existingData.locale),
      });
    }

    if (nextStatus && nextStatus !== previousStatus) {
      await docRef.collection("events").add({
        type: "status_changed",
        fromStatus: previousStatus,
        toStatus: nextStatus,
        actorUid: decoded.uid,
        note:
          typeof body.internalNotes === "string" && body.internalNotes.trim()
            ? body.internalNotes.trim()
            : null,
        emailSent: approvalEmail ? approvalEmail.sent : null,
        emailError: approvalEmail?.errorMessage || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      status: "updated",
      approvalEmail: approvalEmail || undefined,
    });
  } catch (error) {
    captureServerException(error, { route: "api/admin/providers/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza prestatorul." },
      { status: 500 }
    );
  }
}

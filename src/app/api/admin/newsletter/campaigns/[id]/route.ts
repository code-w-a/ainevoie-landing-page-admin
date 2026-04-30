import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import {
  isCampaignTemplateId,
  normalizePublicBaseUrl,
  renderCampaignTemplate,
  validateCampaignTemplateInput,
  type CampaignTemplateId,
} from "@/lib/emailTemplates/campaignTemplates";
import { sanitizePayload } from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

const EDITABLE_STATUSES = new Set(["draft", "scheduled"]);

const CONTENT_KEYS = new Set([
  "subject",
  "previewText",
  "html",
  "text",
  "templateId",
  "templateData",
  "templateVersion",
  "filters",
  "sendConfig",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatus(value: unknown): string {
  return String(value || "").toLowerCase();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(_request);
    const { id } = await context.params;
    const db = getAdminDb();
    const snap = await db.collection("newsletter_campaigns").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campania nu există." }, { status: 404 });
    }

    const item = serializeDoc(snap);
    if (!item) {
      return NextResponse.json({ error: "Campania nu există." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/GET" });
    return NextResponse.json(
      { error: "Nu am putut încărca campania." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();
    const docRef = db.collection("newsletter_campaigns").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campania nu există." }, { status: 404 });
    }

    const existing = snap.data() || {};
    const status = normalizeStatus(existing.status);

    const touchesContent = Object.keys(body).some((key) => CONTENT_KEYS.has(key));
    if (touchesContent && !EDITABLE_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error:
            "Campania nu poate fi editată în acest status. Folosește „Copiază ca draft” pentru o variantă nouă.",
        },
        { status: 409 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (typeof body.subject === "string") {
      const subject = readString(body.subject);
      if (!subject) {
        return NextResponse.json({ error: "Subiectul nu poate fi gol." }, { status: 400 });
      }
      updates.subject = subject;
    }

    if (typeof body.previewText === "string" || body.previewText === null) {
      updates.previewText =
        body.previewText === null ? null : readString(body.previewText) || null;
    }

    if (typeof body.filters !== "undefined" && EDITABLE_STATUSES.has(status)) {
      updates.filters = body.filters;
    }

    if (typeof body.sendConfig !== "undefined" && EDITABLE_STATUSES.has(status)) {
      updates.sendConfig = body.sendConfig;
    }

    if (!EDITABLE_STATUSES.has(status)) {
      await docRef.update(sanitizePayload(updates));
      return NextResponse.json({ status: "ok" });
    }

    const subjectAfter =
      typeof updates.subject === "string" ?
        (updates.subject as string)
      : readString(existing.subject);
    if (!subjectAfter) {
      return NextResponse.json({ error: "Subiectul este obligatoriu." }, { status: 400 });
    }

    const wantsLegacyHtml =
      typeof body.html === "string" && readString(body.html).length > 0;
    const templateIdRaw =
      typeof body.templateId !== "undefined" ? body.templateId : existing.templateId;
    const resolvedTemplateId = isCampaignTemplateId(templateIdRaw) ?
        templateIdRaw
      : isCampaignTemplateId(existing.templateId) ?
        (existing.templateId as CampaignTemplateId)
      : null;

    const mergedTemplateData: Record<string, unknown> = isRecord(existing.templateData) ?
        { ...existing.templateData }
      : {};
    if (isRecord(body.templateData)) {
      Object.assign(mergedTemplateData, body.templateData);
    }

    const shouldRerenderTemplate =
      Boolean(resolvedTemplateId) &&
      (typeof body.templateId !== "undefined" ||
        typeof body.templateData !== "undefined" ||
        typeof body.subject === "string" ||
        typeof body.previewText === "string" ||
        typeof body.templateVersion !== "undefined");

    if (shouldRerenderTemplate && resolvedTemplateId) {
      const validation = validateCampaignTemplateInput({
        templateId: resolvedTemplateId,
        templateData: mergedTemplateData,
      });
      if (validation.errors.length > 0) {
        return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
      }

      const settingsDoc = await db.collection("newsletter_settings").doc("default").get();
      const settings = settingsDoc.data() || {};
      const baseUrlRaw = readString(settings.baseUrl);
      const baseUrl = normalizePublicBaseUrl(baseUrlRaw);
      if (!baseUrl) {
        return NextResponse.json(
          {
            error:
              "Setează URL-ul public de bază în Setări newsletter înainte să salvezi campania.",
          },
          { status: 400 }
        );
      }

      const rendered = renderCampaignTemplate({
        templateId: resolvedTemplateId,
        templateData: validation.normalizedData,
        baseUrl,
        subject: subjectAfter,
      });

      updates.html = rendered.html;
      updates.text = rendered.text;
      updates.templateId = resolvedTemplateId;
      updates.templateData = rendered.normalizedData;
      updates.templateVersion = rendered.templateVersion;
    } else if (wantsLegacyHtml) {
      updates.html = readString(body.html);
      updates.text =
        typeof body.text === "string" ? readString(body.text) || null : readString(existing.text) || null;
      updates.templateId = null;
      updates.templateData = null;
      updates.templateVersion = null;
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { error: "Nu există modificări de salvat." },
        { status: 400 }
      );
    }

    await docRef.update(sanitizePayload(updates));
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut actualiza campania." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    await db.collection("newsletter_campaigns").doc(id).delete();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, { route: "api/admin/newsletter/campaigns/[id]/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut șterge campania." },
      { status: 500 }
    );
  }
}

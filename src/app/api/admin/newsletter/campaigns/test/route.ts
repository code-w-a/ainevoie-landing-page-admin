import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb, requireEnv } from "@/lib/firebaseAdmin";
import {
  isCampaignTemplateId,
  normalizePublicBaseUrl,
  renderCampaignTemplate,
  validateCampaignTemplateInput,
} from "@/lib/emailTemplates/campaignTemplates";
import {
  parseCallableErrorResponse,
  sanitizePayload,
} from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

const region = process.env.FIREBASE_REGION || "europe-west1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function isEmail(value: string): boolean {
  return value.includes("@");
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const toEmail = readString(body.toEmail).toLowerCase();
    const subject = readString(body.subject);
    const previewText = readString(body.previewText) || undefined;
    const templateIdRaw = body.templateId;

    if (!toEmail || !isEmail(toEmail)) {
      return NextResponse.json(
        { error: "Adresa de test este nevalidă." },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: "Subiectul este obligatoriu." },
        { status: 400 }
      );
    }

    if (!isCampaignTemplateId(templateIdRaw)) {
      return NextResponse.json(
        { error: "Template nevalid." },
        { status: 400 }
      );
    }

    const rawTemplateData = isRecord(body.templateData) ? body.templateData : {};
    const validation = validateCampaignTemplateInput({
      templateId: templateIdRaw,
      templateData: rawTemplateData,
    });
    if (validation.errors.length > 0) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const settingsDoc = await db.collection("newsletter_settings").doc("default").get();
    const settings = settingsDoc.data() || {};
    const baseUrl = normalizePublicBaseUrl(readString(settings.baseUrl));
    if (!baseUrl) {
      return NextResponse.json(
        {
          error:
            "Setează URL-ul public de bază în Setări newsletter înainte să trimiți emailul de test.",
        },
        { status: 400 }
      );
    }

    const rendered = renderCampaignTemplate({
      templateId: templateIdRaw,
      templateData: validation.normalizedData,
      baseUrl,
      subject,
    });

    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const adminApiKey = process.env.ADMIN_API_KEY;
    const url = `https://${region}-${projectId}.cloudfunctions.net/sendNewsletterTestEmail`;
    const payload = sanitizePayload({
      data: {
        toEmail,
        subject,
        html: rendered.html,
        text: rendered.text,
        previewText,
        templateId: templateIdRaw,
        templateData: rendered.normalizedData,
        templateVersion: rendered.templateVersion,
        adminApiKey,
      },
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: await parseCallableErrorResponse(
            response,
            "Nu am putut trimite emailul de test."
          ),
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    captureServerException(error, { route: "api/admin/newsletter/campaigns/test/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut trimite emailul de test." },
      { status: 500 }
    );
  }
}

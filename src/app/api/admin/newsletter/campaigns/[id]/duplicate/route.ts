import { NextResponse } from "next/server";
import { getAdminDb, requireEnv } from "@/lib/firebaseAdmin";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import {
  isCampaignTemplateId,
  normalizePublicBaseUrl,
  renderCampaignTemplate,
  validateCampaignTemplateInput,
} from "@/lib/emailTemplates/campaignTemplates";
import {
  readCallableErrorMessage,
  parseCallableErrorResponse,
  sanitizePayload,
} from "@/lib/newsletterAdmin";
import { captureServerException } from "@/lib/sentryServer";

const region = process.env.FIREBASE_REGION || "europe-west1";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(_request);
    const { id } = await context.params;
    const db = getAdminDb();
    const snap = await db.collection("newsletter_campaigns").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campania sursă nu există." }, { status: 404 });
    }

    const source = snap.data() || {};
    const baseSubject = readString(source.subject);
    if (!baseSubject) {
      return NextResponse.json({ error: "Campania sursă nu are subiect." }, { status: 400 });
    }

    const subject = `${baseSubject} (copie)`.slice(0, 240);
    const previewText = readString(source.previewText) || undefined;

    let payloadData: Record<string, unknown> = {
      subject,
      previewText,
    };

    const templateIdRaw = source.templateId;
    if (isCampaignTemplateId(templateIdRaw) && isRecord(source.templateData)) {
      const validation = validateCampaignTemplateInput({
        templateId: templateIdRaw,
        templateData: source.templateData,
      });
      if (validation.errors.length > 0) {
        return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
      }

      const settingsDoc = await db.collection("newsletter_settings").doc("default").get();
      const settings = settingsDoc.data() || {};
      const baseUrl = normalizePublicBaseUrl(readString(settings.baseUrl));
      if (!baseUrl) {
        return NextResponse.json(
          {
            error:
              "Setează URL-ul public de bază în Setări newsletter înainte să copiezi campania.",
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

      payloadData = {
        ...payloadData,
        html: rendered.html,
        text: rendered.text,
        templateId: templateIdRaw,
        templateData: rendered.normalizedData,
        templateVersion: rendered.templateVersion,
      };
    } else {
      const html = readString(source.html);
      if (!html) {
        return NextResponse.json(
          { error: "Campania sursă nu are conținut HTML copiabil." },
          { status: 400 }
        );
      }
      payloadData = {
        ...payloadData,
        html,
        text: readString(source.text) || undefined,
      };
    }

    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const adminApiKey = process.env.ADMIN_API_KEY;

    const url = `https://${region}-${projectId}.cloudfunctions.net/createNewsletterCampaign`;
    const payload = sanitizePayload({
      data: {
        ...payloadData,
        filters: source.filters,
        sendConfig: source.sendConfig,
        adminApiKey,
      },
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const callablePayload = await response.clone().json().catch(() => null);
    const callableError = readCallableErrorMessage(callablePayload);

    if (!response.ok || callableError) {
      return NextResponse.json(
        {
          error:
            callableError ||
            (await parseCallableErrorResponse(
              response,
              "Nu am putut crea copia campaniei."
            )),
        },
        { status: response.ok ? 400 : response.status }
      );
    }

    const data = callablePayload ?? (await response.json().catch(() => null));
    const result = (
      data &&
      typeof data === "object" &&
      "result" in data
    ) ?
      (data as { result: { campaignId?: string; status?: string } }).result
    : (data as { campaignId?: string; status?: string });

    return NextResponse.json({
      campaignId: result?.campaignId || null,
      status: result?.status || "draft",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/newsletter/campaigns/[id]/duplicate/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut duplica campania." },
      { status: 500 }
    );
  }
}

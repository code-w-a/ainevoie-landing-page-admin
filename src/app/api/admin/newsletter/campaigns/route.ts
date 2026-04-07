import { NextResponse } from "next/server";
import { devLogServerError } from "@/lib/devServerErrorLog";
import { getAdminDb, requireEnv, serializeDoc } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
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

const region = process.env.FIREBASE_REGION || "europe-west1";
const ALLOWED_SORTS: Record<string, string> = {
  createdAt: "createdAt",
  subject: "subject",
  sent: "stats.sent",
  failed: "stats.failed",
  total: "stats.total",
};

function parseCursor(cursor: string, field: string) {
  if (field === "createdAt") {
    const parsed = new Date(cursor);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (field === "subject") {
    return cursor;
  }
  const numberValue = Number(cursor);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function serializeCursor(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as FirebaseFirestore.Timestamp).toDate().toISOString();
  }
  return value ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 100);
    const cursor = searchParams.get("cursor");
    const status = searchParams.get("status");
    const sortByKey = searchParams.get("sortBy") || "createdAt";
    const sortField = ALLOWED_SORTS[sortByKey] || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection("newsletter_campaigns")
      .orderBy(sortField, sortDir)
      .limit(limit);

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    if (cursor) {
      const parsedCursor = parseCursor(cursor, sortField);
      if (parsedCursor !== null) {
        query = query.startAfter(parsedCursor);
      }
    }

    const snapshot = await query.get();

    const items = snapshot.docs.map(serializeDoc).filter(Boolean);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? serializeCursor(lastDoc.get(sortField)) : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    devLogServerError("GET /api/admin/newsletter/campaigns", error);
    return NextResponse.json(
      { error: "Nu am putut încărca campaniile." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const subject = readString(body.subject);
    if (!subject) {
      return NextResponse.json(
        { error: "Subiectul este obligatoriu." },
        { status: 400 }
      );
    }

    const previewText = readString(body.previewText) || undefined;
    const legacyHtml = readString(body.html);
    const legacyText = readString(body.text);
    const db = getAdminDb();
    let payloadData: Record<string, unknown> = {
      ...body,
      subject,
      previewText,
    };

    if (legacyHtml) {
      payloadData = {
        ...payloadData,
        html: legacyHtml,
        text: legacyText || undefined,
      };
    } else {
      const templateIdRaw = body.templateId;
      if (!isCampaignTemplateId(templateIdRaw)) {
        return NextResponse.json(
          { error: "Template nevalid. Alege unul dintre template-urile disponibile." },
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

      const settingsDoc = await db
        .collection("newsletter_settings")
        .doc("default")
        .get();
      const settings = settingsDoc.data() || {};
      const baseUrlRaw = readString(settings.baseUrl);
      const baseUrl = normalizePublicBaseUrl(baseUrlRaw);

      if (!baseUrl) {
        return NextResponse.json(
          {
            error:
              "Setează URL-ul public de bază în Setări newsletter înainte să creezi campanii.",
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
    }

    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const adminApiKey = process.env.ADMIN_API_KEY;

    const url = `https://${region}-${projectId}.cloudfunctions.net/createNewsletterCampaign`;
    const payload = sanitizePayload({
      data: {
        ...payloadData,
        filters: body.filters,
        sendConfig: body.sendConfig,
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
              "Nu am putut crea campania."
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
      (data as { result: { campaignId?: string; status?: string } }).result :
      (data as { campaignId?: string; status?: string });

    return NextResponse.json({
      campaignId: result?.campaignId || null,
      status: result?.status || "draft",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Nu am putut crea campania." },
      { status: 500 }
    );
  }
}

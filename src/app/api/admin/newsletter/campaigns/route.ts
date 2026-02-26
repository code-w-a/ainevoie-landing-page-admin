import { NextResponse } from "next/server";
import { getAdminDb, requireEnv, serializeDoc } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import {
  isCampaignTemplateId,
  normalizePublicBaseUrl,
  renderCampaignTemplate,
  validateCampaignTemplateInput,
} from "@/lib/emailTemplates/campaignTemplates";

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
    return NextResponse.json(
      { error: "Failed to load campaigns" },
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
        { error: "Subject este obligatoriu." },
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
          { error: "Template invalid. Alege unul dintre template-urile disponibile." },
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
              "Setează Public base URL în Newsletter Settings înainte să creezi campanii.",
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
    const payload = {
      data: {
        ...payloadData,
        adminApiKey,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || "Failed to create campaign" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

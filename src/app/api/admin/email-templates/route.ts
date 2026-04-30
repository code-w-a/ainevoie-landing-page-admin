import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
import { devLogServerError } from "@/lib/devServerErrorLog";
import {
  EMAIL_TEMPLATES_DOC_PATH,
  EMAIL_TEMPLATE_KINDS,
  EMAIL_TEMPLATE_LOCALES,
  EmailTemplateConfig,
  getDefaultEmailTemplateConfig,
  mergeEmailTemplateConfig,
} from "@/lib/emailTemplates/adminEmailTemplates";
import { invalidateEmailTemplateConfigCache } from "@/lib/emailTemplates/adminEmailTemplatesServer";

const MAX_SUBJECT = 200;
const MAX_GREETING = 500;
const MAX_INTRO = 2000;
const MAX_STEP = 500;
const MAX_STEPS = 10;
const MAX_NOTE = 2000;
const MAX_SIGNATURE = 500;

function trimOrEmpty(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

function sanitizeTemplateContent(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const steps = Array.isArray(data.steps)
    ? data.steps
        .slice(0, MAX_STEPS)
        .map((item) => trimOrEmpty(item, MAX_STEP))
        .filter((item) => item.length > 0)
    : [];
  return {
    subject: trimOrEmpty(data.subject, MAX_SUBJECT),
    greeting: trimOrEmpty(data.greeting, MAX_GREETING),
    intro: trimOrEmpty(data.intro, MAX_INTRO),
    steps,
    note: trimOrEmpty(data.note, MAX_NOTE),
    signature: trimOrEmpty(data.signature, MAX_SIGNATURE),
  };
}

function sanitizeTemplateLocales(raw: unknown) {
  if (!raw || typeof raw !== "object") return {};
  const data = raw as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const locale of EMAIL_TEMPLATE_LOCALES) {
    const content = sanitizeTemplateContent(data[locale]);
    if (content) result[locale] = content;
  }
  return result;
}

function sanitizePayload(raw: unknown) {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const payload: Record<string, unknown> = {};

  for (const kind of EMAIL_TEMPLATE_KINDS) {
    const locales = sanitizeTemplateLocales(data[kind]);
    if (Object.keys(locales).length > 0) {
      payload[kind] = locales;
    }
  }

  return payload;
}

async function loadRawAndMerge(): Promise<{
  item: EmailTemplateConfig;
  raw: Record<string, unknown>;
}> {
  const db = getAdminDb();
  const snap = await db
    .collection(EMAIL_TEMPLATES_DOC_PATH.collection)
    .doc(EMAIL_TEMPLATES_DOC_PATH.doc)
    .get();
  const raw = snap.exists ? (snap.data() || {}) : {};
  return { item: mergeEmailTemplateConfig(raw), raw: raw as Record<string, unknown> };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { item } = await loadRawAndMerge();
    return NextResponse.json({
      item,
      defaults: getDefaultEmailTemplateConfig(),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/email-templates/route.ts",
    });
    devLogServerError("GET /api/admin/email-templates", error);
    return NextResponse.json(
      { error: "Nu am putut încărca template-urile." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const payload = sanitizePayload(body);

    const db = getAdminDb();
    await db
      .collection(EMAIL_TEMPLATES_DOC_PATH.collection)
      .doc(EMAIL_TEMPLATES_DOC_PATH.doc)
      .set(
        {
          ...payload,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    invalidateEmailTemplateConfigCache();

    const { item } = await loadRawAndMerge();
    return NextResponse.json({
      item,
      defaults: getDefaultEmailTemplateConfig(),
      status: "ok",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/email-templates/route.ts",
    });
    devLogServerError("PUT /api/admin/email-templates", error);
    return NextResponse.json(
      { error: "Nu am putut salva template-urile." },
      { status: 500 }
    );
  }
}

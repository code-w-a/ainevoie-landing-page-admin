import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  EMAIL_TEMPLATES_DOC_PATH,
  EmailTemplateConfig,
  getDefaultEmailTemplateConfig,
  mergeEmailTemplateConfig,
} from "@/lib/emailTemplates/adminEmailTemplates";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  config: EmailTemplateConfig;
  at: number;
};

let cached: CacheEntry | null = null;

export function invalidateEmailTemplateConfigCache(): void {
  cached = null;
}

export async function getEmailTemplateConfig(): Promise<EmailTemplateConfig> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.config;
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection(EMAIL_TEMPLATES_DOC_PATH.collection)
      .doc(EMAIL_TEMPLATES_DOC_PATH.doc)
      .get();
    const raw = snap.exists ? snap.data() || {} : {};
    const config = mergeEmailTemplateConfig(raw);
    cached = { config, at: now };
    return config;
  } catch {
    const config = getDefaultEmailTemplateConfig();
    cached = { config, at: now };
    return config;
  }
}

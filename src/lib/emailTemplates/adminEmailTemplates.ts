import type { AppLocale } from "@/lib/apiLocale";

export type EmailTemplateKind = "providerWelcome" | "providerApproved";

export type TemplateContent = {
  subject: string;
  greeting: string;
  intro: string;
  steps: string[];
  note: string;
  signature: string;
};

export type EmailTemplateConfig = {
  providerWelcome: Record<AppLocale, TemplateContent>;
  providerApproved: Record<AppLocale, TemplateContent>;
};

export type TemplateVars = {
  fullName?: string;
  email?: string;
};

export type RenderedTemplate = {
  subject: string;
  html: string;
  text: string;
};

export const EMAIL_TEMPLATE_DEFAULTS: EmailTemplateConfig = {
  providerWelcome: {
    ro: {
      subject: "Bine ai venit pe AInevoie",
      greeting: "Salut, {{fullName}}!",
      intro:
        "Contul tău de prestator a fost creat cu succes și este salvat în baza noastră comună.",
      steps: [
        "Echipa verifică datele trimise.",
        "Dacă e nevoie, primești cereri de completare.",
        "La lansare, te autentifici direct cu acest cont.",
      ],
      note:
        "Momentan suntem în prelaunch: aplicația mobilă AInevoie este în curs de finalizare, iar datele tale te vor aștepta la lansare.",
      signature: "Cu drag,\nEchipa AInevoie",
    },
    en: {
      subject: "Welcome to AInevoie",
      greeting: "Hi {{fullName}},",
      intro:
        "Thank you for signing up as a provider. Your account is created and your details are on file with AInevoie.",
      steps: [
        "Our team reviews the information you submitted.",
        "If we need anything else, we will contact you.",
        "When the app goes live, sign in with this same account.",
      ],
      note:
        "We are currently in prelaunch: the AInevoie mobile app is in the final stages of development and your account will be waiting for you at launch.",
      signature: "Kind regards,\nThe AInevoie team",
    },
  },
  providerApproved: {
    ro: {
      subject: "Contul tău AInevoie a fost aprobat",
      greeting: "Felicitări, {{fullName}}!",
      intro:
        "Contul tău de prestator a fost verificat și aprobat de echipa AInevoie. Din acest moment ești parte activă din rețeaua noastră de prestatori.",
      steps: [
        "Păstrează acest email ca dovadă a aprobării.",
        "Te vom anunța prin email când aplicația mobilă este disponibilă.",
        "La lansare te vei autentifica cu adresa {{email}} pentru a prelua primele cereri.",
      ],
      note: "",
      signature: "Cu drag,\nEchipa AInevoie",
    },
    en: {
      subject: "Your AInevoie account has been approved",
      greeting: "Congratulations, {{fullName}}!",
      intro:
        "Your provider account has been reviewed and approved by the AInevoie team. You are now an active member of our provider network.",
      steps: [
        "Keep this email as proof of your approval.",
        "We will notify you by email as soon as the mobile app is available.",
        "At launch, sign in with {{email}} to start receiving requests.",
      ],
      note: "",
      signature: "Kind regards,\nThe AInevoie team",
    },
  },
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

const PLACEHOLDER_RE = /\{\{\s*(fullName|email)\s*\}\}/g;

function replaceVarsRaw(value: string, vars: TemplateVars): string {
  return value.replace(PLACEHOLDER_RE, (_match, key: keyof TemplateVars) => {
    const v = vars[key];
    return typeof v === "string" ? v : "";
  });
}

function replaceVarsHtml(value: string, vars: TemplateVars): string {
  return value.replace(PLACEHOLDER_RE, (_match, key: keyof TemplateVars) => {
    const v = vars[key];
    return typeof v === "string" ? escapeHtml(v) : "";
  });
}

function normalizeLocale(locale: string | undefined | null): AppLocale {
  return locale === "en" ? "en" : "ro";
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? value : fallback;
}

function normalizeOptionalString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return value;
}

function normalizeSteps(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const filtered = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return filtered.length > 0 ? filtered : fallback;
}

function mergeTemplateContent(
  raw: unknown,
  defaults: TemplateContent
): TemplateContent {
  if (!raw || typeof raw !== "object") return defaults;
  const data = raw as Record<string, unknown>;
  return {
    subject: normalizeString(data.subject, defaults.subject),
    greeting: normalizeString(data.greeting, defaults.greeting),
    intro: normalizeString(data.intro, defaults.intro),
    steps: normalizeSteps(data.steps, defaults.steps),
    note: normalizeOptionalString(data.note, defaults.note),
    signature: normalizeString(data.signature, defaults.signature),
  };
}

function mergeTemplateLocales(
  raw: unknown,
  defaults: Record<AppLocale, TemplateContent>
): Record<AppLocale, TemplateContent> {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    ro: mergeTemplateContent(data.ro, defaults.ro),
    en: mergeTemplateContent(data.en, defaults.en),
  };
}

export function mergeEmailTemplateConfig(
  raw: unknown
): EmailTemplateConfig {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    providerWelcome: mergeTemplateLocales(
      data.providerWelcome,
      EMAIL_TEMPLATE_DEFAULTS.providerWelcome
    ),
    providerApproved: mergeTemplateLocales(
      data.providerApproved,
      EMAIL_TEMPLATE_DEFAULTS.providerApproved
    ),
  };
}

function renderSteps(steps: string[], vars: TemplateVars): { html: string; text: string } {
  const htmlItems = steps
    .map(
      (step) =>
        `<li style="margin-bottom:8px;">${replaceVarsHtml(step, vars)}</li>`
    )
    .join("");
  const textItems = steps
    .map((step, index) => `${index + 1}) ${replaceVarsRaw(step, vars)}`)
    .join("\n");
  return { html: htmlItems, text: textItems };
}

function renderNoteBlockHtml(note: string, vars: TemplateVars): string {
  const lines = note.split(/\r?\n/);
  const body = lines
    .map((line) => replaceVarsHtml(escapeHtml(line), vars))
    .join("<br/>");
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 18px;">
      <tr>
        <td style="border-left:3px solid #d35400;background:#fff7ed;padding:12px 16px;border-radius:4px;">
          <p style="margin:0;color:#7c2d12;">${body}</p>
        </td>
      </tr>
    </table>
  `;
}

function renderNoteBlockText(note: string, vars: TemplateVars): string {
  return replaceVarsRaw(note, vars);
}

export type RenderTemplateParams = {
  kind: EmailTemplateKind;
  locale: AppLocale;
  config: EmailTemplateConfig;
  vars: TemplateVars;
};

export function renderTemplate(params: RenderTemplateParams): RenderedTemplate {
  const { kind, locale, config, vars } = params;
  const localeKey = normalizeLocale(locale);
  const content = config[kind][localeKey];

  const subject = replaceVarsRaw(content.subject, vars);
  const greetingHtml = replaceVarsHtml(content.greeting, vars);
  const introHtml = replaceVarsHtml(content.intro, vars);
  const signatureLines = content.signature.split(/\r?\n/);
  const signatureHtml = signatureLines
    .map((line) => replaceVarsHtml(line, vars))
    .join("<br/>");

  const { html: stepsHtml, text: stepsText } = renderSteps(content.steps, vars);

  const noteTrimmed =
    typeof content.note === "string" ? content.note.trim() : "";
  const hasNote = noteTrimmed.length > 0;
  const noteHtml = hasNote ? renderNoteBlockHtml(content.note, vars) : "";
  const noteText = hasNote ? renderNoteBlockText(content.note, vars) : "";

  const stepsSectionHtml =
    stepsHtml.length > 0 ?
      `<ol style="margin:0 0 18px 20px;padding:0;">${stepsHtml}</ol>`
    : "";

  const html = `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;padding:0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:0;border-radius:0;overflow:visible;">
              <tr>
                <td style="background:#d35400;padding:20px 24px;color:#ffffff;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;">${escapeHtml(subject)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;">${greetingHtml}</p>
                  <p style="margin:0 0 12px;">${introHtml}</p>
                  ${stepsSectionHtml}
                  ${noteHtml}
                  <p style="margin:0;">${signatureHtml}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const textLines: string[] = [
    replaceVarsRaw(content.greeting, vars),
    "",
    replaceVarsRaw(content.intro, vars),
  ];
  if (stepsText.length > 0) {
    textLines.push("", stepsText);
  }
  if (noteText.length > 0) {
    textLines.push("", noteText);
  }
  textLines.push(
    "",
    "Suport: contact@ai-nevoie.ro",
    "",
    replaceVarsRaw(content.signature, vars)
  );

  return {
    subject,
    html,
    text: textLines.join("\n"),
  };
}

export function getDefaultEmailTemplateConfig(): EmailTemplateConfig {
  return mergeEmailTemplateConfig(EMAIL_TEMPLATE_DEFAULTS);
}

export const EMAIL_TEMPLATES_DOC_PATH = {
  collection: "admin_settings" as const,
  doc: "email_templates" as const,
};

export const EMAIL_TEMPLATE_KINDS: EmailTemplateKind[] = [
  "providerWelcome",
  "providerApproved",
];

export const EMAIL_TEMPLATE_LOCALES: AppLocale[] = ["ro", "en"];

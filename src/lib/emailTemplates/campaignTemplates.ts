export const CAMPAIGN_TEMPLATE_VERSION = "v1" as const;

export type CampaignTemplateId = "updates" | "promo" | "alert";
type AlertSeverity = "info" | "important" | "urgent";

type CampaignTemplateFieldType = "text" | "textarea" | "url" | "select";

type CampaignTemplateFieldOption = {
  label: string;
  value: string;
};

export type CampaignTemplateField = {
  key: string;
  label: string;
  type: CampaignTemplateFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  rows?: number;
  options?: CampaignTemplateFieldOption[];
};

export type CampaignTemplateDefinition = {
  id: CampaignTemplateId;
  name: string;
  description: string;
  fields: CampaignTemplateField[];
  defaults: Record<string, string>;
};

const alertSeverityOptions: CampaignTemplateFieldOption[] = [
  { value: "info", label: "Info" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

const templateCatalog: Record<CampaignTemplateId, CampaignTemplateDefinition> = {
  updates: {
    id: "updates",
    name: "Noutăți",
    description: "Update general pentru comunitate, produs sau servicii.",
    fields: [
      {
        key: "title",
        label: "Titlu principal",
        type: "text",
        placeholder: "Ce este nou săptămâna aceasta",
        required: true,
      },
      {
        key: "lead",
        label: "Introducere",
        type: "textarea",
        rows: 3,
        placeholder: "Un rezumat scurt al mesajului.",
        required: true,
      },
      {
        key: "content",
        label: "Conținut principal",
        type: "textarea",
        rows: 6,
        placeholder: "Detalii, context, update-uri.",
        required: true,
      },
      {
        key: "highlights",
        label: "Highlights (câte unul pe linie)",
        type: "textarea",
        rows: 4,
        placeholder: "Lansare nouă\nParteneriat nou\nExtindere servicii",
      },
      {
        key: "ctaLabel",
        label: "Text buton (opțional)",
        type: "text",
        placeholder: "Vezi noutățile",
      },
      {
        key: "ctaUrl",
        label: "Link buton (opțional)",
        type: "url",
        placeholder: "https://ainevoie.ro/blog",
      },
    ],
    defaults: {
      title: "",
      lead: "",
      content: "",
      highlights: "",
      ctaLabel: "",
      ctaUrl: "",
    },
  },
  promo: {
    id: "promo",
    name: "Promo",
    description: "Campanie promoțională cu ofertă și call-to-action clar.",
    fields: [
      {
        key: "badgeText",
        label: "Badge promo",
        type: "text",
        placeholder: "Ofertă limitată",
        required: true,
      },
      {
        key: "title",
        label: "Titlu ofertă",
        type: "text",
        placeholder: "20% reducere la pachetul Pro",
        required: true,
      },
      {
        key: "offerDetails",
        label: "Detalii ofertă",
        type: "textarea",
        rows: 5,
        placeholder: "Condiții, ce include, pentru cine este oferta.",
        required: true,
      },
      {
        key: "promoCode",
        label: "Cod promo (opțional)",
        type: "text",
        placeholder: "AINEVOIE20",
      },
      {
        key: "deadline",
        label: "Deadline (opțional)",
        type: "text",
        placeholder: "Valabil până pe 31 martie 2026",
      },
      {
        key: "ctaLabel",
        label: "Text buton",
        type: "text",
        placeholder: "Activează oferta",
        required: true,
      },
      {
        key: "ctaUrl",
        label: "Link buton",
        type: "url",
        placeholder: "https://ainevoie.ro/oferta",
        required: true,
      },
    ],
    defaults: {
      badgeText: "",
      title: "",
      offerDetails: "",
      promoCode: "",
      deadline: "",
      ctaLabel: "",
      ctaUrl: "",
    },
  },
  alert: {
    id: "alert",
    name: "Alertă",
    description: "Mesaj important cu acțiuni clare pentru destinatari.",
    fields: [
      {
        key: "severity",
        label: "Severitate",
        type: "select",
        required: true,
        options: alertSeverityOptions,
      },
      {
        key: "title",
        label: "Titlu alertă",
        type: "text",
        placeholder: "Actualizare importantă pentru contul tău",
        required: true,
      },
      {
        key: "whatChanged",
        label: "Ce s-a schimbat",
        type: "textarea",
        rows: 4,
        placeholder: "Descrie pe scurt schimbarea.",
        required: true,
      },
      {
        key: "actionRequired",
        label: "Ce trebuie făcut",
        type: "textarea",
        rows: 4,
        placeholder: "Pașii pe care trebuie să îi facă utilizatorul.",
        required: true,
      },
      {
        key: "ctaLabel",
        label: "Text buton",
        type: "text",
        placeholder: "Verifică acum",
        required: true,
      },
      {
        key: "ctaUrl",
        label: "Link buton",
        type: "url",
        placeholder: "https://ainevoie.ro/dashboard",
        required: true,
      },
    ],
    defaults: {
      severity: "important",
      title: "",
      whatChanged: "",
      actionRequired: "",
      ctaLabel: "",
      ctaUrl: "",
    },
  },
};

const alertStyles: Record<
  AlertSeverity,
  { badgeLabel: string; badgeBg: string; badgeColor: string; borderColor: string }
> = {
  info: {
    badgeLabel: "Info",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
    borderColor: "#93c5fd",
  },
  important: {
    badgeLabel: "Important",
    badgeBg: "#fef3c7",
    badgeColor: "#b45309",
    borderColor: "#f59e0b",
  },
  urgent: {
    badgeLabel: "Urgent",
    badgeBg: "#fee2e2",
    badgeColor: "#b91c1c",
    borderColor: "#f87171",
  },
};

export const campaignTemplateList = Object.values(templateCatalog);

export function isCampaignTemplateId(value: unknown): value is CampaignTemplateId {
  return value === "updates" || value === "promo" || value === "alert";
}

export function getCampaignTemplateDefinition(
  templateId: CampaignTemplateId
): CampaignTemplateDefinition {
  return templateCatalog[templateId];
}

export function getDefaultTemplateData(
  templateId: CampaignTemplateId
): Record<string, string> {
  return { ...templateCatalog[templateId].defaults };
}

export function normalizePublicBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function trimString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return normalizeLineBreaks(value).trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toLines(value: string): string[] {
  return normalizeLineBreaks(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderMultilineHtml(value: string): string {
  return escapeHtml(normalizeLineBreaks(value)).replace(/\n/g, "<br/>");
}

function buildLogoUrl(baseUrl: string): string {
  return `${baseUrl}/images/logo/logo.svg`;
}

function buildButtonHtml(label: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
      <tr>
        <td style="border-radius:8px;background:#d35400;padding:0;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:600;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function wrapTemplateHtml(input: {
  subject: string;
  logoUrl: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(input.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:24px;border-bottom:1px solid #e5e7eb;">
                <img src="${escapeHtml(input.logoUrl)}" alt="AInevoie" width="144" style="display:block;border:0;max-width:144px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 24px 24px;">
                ${input.bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderUpdatesTemplate(data: Record<string, string>) {
  const highlights = toLines(data.highlights);
  const hasCta = Boolean(data.ctaLabel && data.ctaUrl);

  const highlightsHtml =
    highlights.length > 0
      ? `
        <div style="margin-top:16px;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#111827;">Pe scurt</p>
          <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.6;">
            ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      `
      : "";

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#111827;">
      ${escapeHtml(data.title)}
    </h1>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#374151;">
      ${renderMultilineHtml(data.lead)}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
      ${renderMultilineHtml(data.content)}
    </p>
    ${highlightsHtml}
    ${hasCta ? buildButtonHtml(data.ctaLabel, data.ctaUrl) : ""}
  `;

  const text = [
    data.title,
    "",
    data.lead,
    "",
    data.content,
    highlights.length ? "" : null,
    highlights.length ? `Pe scurt:\n- ${highlights.join("\n- ")}` : null,
    hasCta ? "" : null,
    hasCta ? `${data.ctaLabel}: ${data.ctaUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { bodyHtml, text };
}

function renderPromoTemplate(data: Record<string, string>) {
  const bodyHtml = `
    <p style="margin:0 0 10px;">
      <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:700;letter-spacing:.02em;">
        ${escapeHtml(data.badgeText)}
      </span>
    </p>
    <h1 style="margin:0 0 12px;font-size:28px;line-height:1.25;color:#111827;">
      ${escapeHtml(data.title)}
    </h1>
    <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">
      ${renderMultilineHtml(data.offerDetails)}
    </p>
    ${
      data.promoCode
        ? `
      <div style="margin-top:16px;padding:14px;border:1px dashed #d97706;border-radius:10px;background:#fff7ed;">
        <p style="margin:0 0 6px;font-size:12px;color:#9a3412;">Cod promo</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#9a3412;letter-spacing:0.04em;">
          ${escapeHtml(data.promoCode)}
        </p>
      </div>
    `
        : ""
    }
    ${
      data.deadline
        ? `
      <p style="margin:14px 0 0;font-size:13px;color:#6b7280;">
        ${escapeHtml(data.deadline)}
      </p>
    `
        : ""
    }
    ${buildButtonHtml(data.ctaLabel, data.ctaUrl)}
  `;

  const text = [
    `[${data.badgeText}]`,
    data.title,
    "",
    data.offerDetails,
    data.promoCode ? "" : null,
    data.promoCode ? `Cod promo: ${data.promoCode}` : null,
    data.deadline ? `Deadline: ${data.deadline}` : null,
    "",
    `${data.ctaLabel}: ${data.ctaUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { bodyHtml, text };
}

function getAlertStyle(severity: string) {
  if (severity === "info" || severity === "important" || severity === "urgent") {
    return alertStyles[severity];
  }
  return alertStyles.important;
}

function renderAlertTemplate(data: Record<string, string>) {
  const style = getAlertStyle(data.severity);
  const bodyHtml = `
    <p style="margin:0 0 10px;">
      <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${style.badgeBg};color:${style.badgeColor};font-size:12px;font-weight:700;">
        ${style.badgeLabel}
      </span>
    </p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#111827;">
      ${escapeHtml(data.title)}
    </h1>
    <div style="margin-top:12px;padding:14px;border:1px solid ${style.borderColor};border-radius:10px;background:#fafafa;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Ce s-a schimbat</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
        ${renderMultilineHtml(data.whatChanged)}
      </p>
    </div>
    <div style="margin-top:12px;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Acțiune necesară</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
        ${renderMultilineHtml(data.actionRequired)}
      </p>
    </div>
    ${buildButtonHtml(data.ctaLabel, data.ctaUrl)}
  `;

  const text = [
    `[${style.badgeLabel}] ${data.title}`,
    "",
    `Ce s-a schimbat:\n${data.whatChanged}`,
    "",
    `Acțiune necesară:\n${data.actionRequired}`,
    "",
    `${data.ctaLabel}: ${data.ctaUrl}`,
  ].join("\n");

  return { bodyHtml, text };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeCampaignTemplateData(
  templateId: CampaignTemplateId,
  templateData: Record<string, unknown>
): Record<string, string> {
  const template = getCampaignTemplateDefinition(templateId);
  const normalized = { ...template.defaults };

  template.fields.forEach((field) => {
    if (field.key in templateData) {
      normalized[field.key] = trimString(templateData[field.key]);
    }
  });

  return normalized;
}

export function validateCampaignTemplateInput(input: {
  templateId: CampaignTemplateId;
  templateData: Record<string, unknown>;
}) {
  const template = getCampaignTemplateDefinition(input.templateId);
  const normalizedData = normalizeCampaignTemplateData(
    input.templateId,
    input.templateData
  );
  const errors: string[] = [];

  template.fields.forEach((field) => {
    const value = normalizedData[field.key];
    if (field.required && !value) {
      errors.push(`Câmp obligatoriu: ${field.label}.`);
      return;
    }

    if (field.type === "url" && value && !isHttpUrl(value)) {
      errors.push(`Link invalid în câmpul ${field.label}.`);
    }

    if (field.type === "select" && field.options?.length) {
      const valid = field.options.some((option) => option.value === value);
      if (!valid) {
        errors.push(`Valoare invalidă în câmpul ${field.label}.`);
      }
    }
  });

  if (input.templateId === "updates") {
    const hasLabel = Boolean(normalizedData.ctaLabel);
    const hasUrl = Boolean(normalizedData.ctaUrl);
    if (hasLabel !== hasUrl) {
      errors.push("Pentru Noutăți, completează atât textul butonului cât și linkul.");
    }
  }

  return { errors, normalizedData };
}

export function renderCampaignTemplate(input: {
  templateId: CampaignTemplateId;
  templateData: Record<string, unknown>;
  baseUrl: string;
  subject: string;
}) {
  const normalizedBaseUrl = normalizePublicBaseUrl(input.baseUrl);
  if (!normalizedBaseUrl) {
    throw new Error("Public base URL invalid.");
  }

  const validation = validateCampaignTemplateInput({
    templateId: input.templateId,
    templateData: input.templateData,
  });
  if (validation.errors.length) {
    throw new Error(validation.errors[0]);
  }

  const subject = trimString(input.subject) || "Campanie AInevoie";
  const logoUrl = buildLogoUrl(normalizedBaseUrl);
  const data = validation.normalizedData;

  let templateOutput: { bodyHtml: string; text: string };
  if (input.templateId === "updates") {
    templateOutput = renderUpdatesTemplate(data);
  } else if (input.templateId === "promo") {
    templateOutput = renderPromoTemplate(data);
  } else {
    templateOutput = renderAlertTemplate(data);
  }

  return {
    html: wrapTemplateHtml({
      subject,
      logoUrl,
      bodyHtml: templateOutput.bodyHtml,
    }),
    text: templateOutput.text,
    normalizedData: data,
    templateVersion: CAMPAIGN_TEMPLATE_VERSION,
  };
}

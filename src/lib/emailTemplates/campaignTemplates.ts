export const CAMPAIGN_TEMPLATE_VERSION = "v3" as const;

export type CampaignTemplateId =
  | "updates"
  | "promo"
  | "alert"
  | "recommendations"
  | "informative"
  | "providers"
  | "general"
  | "event";
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

/** Portocaliu brand (ca emailul de bun venit); contrast mai clar decât slate în client dark mode. */
const EMAIL_BRAND_ORANGE = "#d35400";

const alertSeverityOptions: CampaignTemplateFieldOption[] = [
  { value: "info", label: "Info" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

const updatesLikeFields: CampaignTemplateField[] = [
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
];

const updatesLikeDefaults: Record<string, string> = {
  title: "",
  lead: "",
  content: "",
  highlights: "",
  ctaLabel: "",
  ctaUrl: "",
};

const informativeFields: CampaignTemplateField[] = [
  {
    key: "title",
    label: "Titlu",
    type: "text",
    placeholder: "Subiectul mesajului",
    required: true,
  },
  {
    key: "lead",
    label: "Introducere",
    type: "textarea",
    rows: 3,
    placeholder: "Context sau rezumat în câteva propoziții.",
    required: true,
  },
  {
    key: "content",
    label: "Conținut principal",
    type: "textarea",
    rows: 8,
    placeholder: "Detaliile mesajului.",
    required: true,
  },
  {
    key: "ctaLabel",
    label: "Text buton (opțional)",
    type: "text",
    placeholder: "Află mai multe",
  },
  {
    key: "ctaUrl",
    label: "Link buton (opțional)",
    type: "url",
    placeholder: "https://ainevoie.ro",
  },
];

const informativeDefaults: Record<string, string> = {
  title: "",
  lead: "",
  content: "",
  ctaLabel: "",
  ctaUrl: "",
};

const providersFields: CampaignTemplateField[] = [
  {
    key: "title",
    label: "Titlu mesaj",
    type: "text",
    placeholder: "Actualizare pentru prestatori",
    required: true,
  },
  {
    key: "lead",
    label: "Introducere",
    type: "textarea",
    rows: 3,
    placeholder: "De ce este relevant acest mesaj pentru prestatori.",
    required: true,
  },
  {
    key: "content",
    label: "Conținut",
    type: "textarea",
    rows: 8,
    placeholder: "Detalii, pași, termene, linkuri utile.",
    required: true,
  },
  {
    key: "ctaLabel",
    label: "Text buton (opțional)",
    type: "text",
    placeholder: "Deschide în aplicație",
  },
  {
    key: "ctaUrl",
    label: "Link buton (opțional)",
    type: "url",
    placeholder: "https://ainevoie.ro",
  },
];

const providersDefaults: Record<string, string> = {
  title: "",
  lead: "",
  content: "",
  ctaLabel: "",
  ctaUrl: "",
};

const eventFields: CampaignTemplateField[] = [
  {
    key: "title",
    label: "Titlu eveniment",
    type: "text",
    placeholder: "Întâlnire comunitate AInevoie",
    required: true,
  },
  {
    key: "eventDatetime",
    label: "Dată și oră",
    type: "text",
    placeholder: "15 aprilie 2026, 18:00",
    required: true,
  },
  {
    key: "location",
    label: "Loc (opțional)",
    type: "text",
    placeholder: "Online / adresă",
  },
  {
    key: "description",
    label: "Descriere",
    type: "textarea",
    rows: 6,
    placeholder: "Agendă, speakeri, ce trebuie să știe participanții.",
    required: true,
  },
  {
    key: "ctaLabel",
    label: "Text buton",
    type: "text",
    placeholder: "Înscriere",
    required: true,
  },
  {
    key: "ctaUrl",
    label: "Link buton",
    type: "url",
    placeholder: "https://ainevoie.ro/eveniment",
    required: true,
  },
];

const eventDefaults: Record<string, string> = {
  title: "",
  eventDatetime: "",
  location: "",
  description: "",
  ctaLabel: "",
  ctaUrl: "",
};

const templateCatalog: Record<CampaignTemplateId, CampaignTemplateDefinition> = {
  updates: {
    id: "updates",
    name: "Noutăți",
    description: "Update general pentru comunitate, produs sau servicii.",
    fields: updatesLikeFields,
    defaults: { ...updatesLikeDefaults },
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
  recommendations: {
    id: "recommendations",
    name: "Recomandări",
    description: "Listă de recomandări sau resurse pentru cititori.",
    fields: updatesLikeFields,
    defaults: { ...updatesLikeDefaults },
  },
  informative: {
    id: "informative",
    name: "Informativ",
    description: "Mesaj explicativ fără listă de highlights, cu CTA opțional.",
    fields: informativeFields,
    defaults: { ...informativeDefaults },
  },
  providers: {
    id: "providers",
    name: "Furnizori",
    description: "Comunicare dedicată prestatorilor de pe platformă.",
    fields: providersFields,
    defaults: { ...providersDefaults },
  },
  general: {
    id: "general",
    name: "General",
    description: "Același format ca Noutăți în inbox; folosește-l ca categorie generală.",
    fields: updatesLikeFields,
    defaults: { ...updatesLikeDefaults },
  },
  event: {
    id: "event",
    name: "Eveniment",
    description: "Invitație sau anunț cu dată, loc opțional și înscriere.",
    fields: eventFields,
    defaults: { ...eventDefaults },
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
  return typeof value === "string" && value in templateCatalog;
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

/** Acceptă și domenii fără protocol (ex. www.ai-nevoie.ro) și le normalizează la https. */
function coerceAbsoluteHttpUrl(trimmed: string): string {
  if (!trimmed) {
    return "";
  }
  const low = trimmed.toLowerCase();
  if (
    low.startsWith("mailto:") ||
    low.startsWith("tel:") ||
    low.startsWith("javascript:") ||
    low.startsWith("data:")
  ) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (!/^[a-z][\w+.-]*:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(coerceAbsoluteHttpUrl(value));
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
  return `${baseUrl}/images/logo/logo-email.png`;
}

function buildButtonHtml(label: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;">
      <tr>
        <td style="border-radius:10px;background:${EMAIL_BRAND_ORANGE};padding:0;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.01em;">
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
  <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;padding:0;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;width:100%;background:#ffffff;border:0;border-radius:0;overflow:visible;">
            <tr>
              <td style="height:6px;line-height:6px;font-size:0;background:${EMAIL_BRAND_ORANGE};">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:20px 24px 8px 24px;border-bottom:1px solid #e8edf5;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td valign="middle">
                      <img src="${escapeHtml(input.logoUrl)}" alt="AInevoie" width="180" style="display:block;border:0;width:180px;max-width:100%;height:auto;" />
                      <p style="margin:8px 0 0 0;font-size:12px;line-height:1.3;color:#64748b;">
                        Newsletter
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${input.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 18px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  AInevoie • Soluții digitale pentru prestatori
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderUpdatesTemplate(
  data: Record<string, string>,
  options?: { highlightsHeading?: string }
) {
  const highlightsHeading = options?.highlightsHeading ?? "Pe scurt";
  const highlights = toLines(data.highlights);
  const hasCta = Boolean(data.ctaLabel && data.ctaUrl);

  const highlightsHtml =
    highlights.length > 0
      ? `
        <tr>
          <td style="padding-top:16px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
              <tr>
                <td style="padding:14px 14px 6px 14px;font-size:14px;line-height:1.4;font-weight:700;color:#0f172a;">
                  ${escapeHtml(highlightsHeading)}
                </td>
              </tr>
              ${highlights
                .map(
                  (item) => `
                <tr>
                  <td style="padding:0 14px 9px 14px;font-size:14px;line-height:1.55;color:#334155;">
                    • ${escapeHtml(item)}
                  </td>
                </tr>
              `
                )
                .join("")}
            </table>
          </td>
        </tr>
      `
      : "";

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="font-size:28px;line-height:1.25;font-weight:700;color:#0f172a;">
          ${escapeHtml(data.title)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:16px;line-height:1.65;color:#334155;">
          ${renderMultilineHtml(data.lead)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:15px;line-height:1.75;color:#475569;">
          ${renderMultilineHtml(data.content)}
        </td>
      </tr>
      ${highlightsHtml}
      ${
        hasCta
          ? `
        <tr>
          <td>${buildButtonHtml(data.ctaLabel, data.ctaUrl)}</td>
        </tr>
      `
          : ""
      }
    </table>
  `;

  const text = [
    data.title,
    "",
    data.lead,
    "",
    data.content,
    highlights.length ? "" : null,
    highlights.length ? `${highlightsHeading}:\n- ${highlights.join("\n- ")}` : null,
    hasCta ? "" : null,
    hasCta ? `${data.ctaLabel}: ${data.ctaUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { bodyHtml, text };
}

function renderInformativeTemplate(data: Record<string, string>) {
  const hasCta = Boolean(data.ctaLabel && data.ctaUrl);
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="font-size:28px;line-height:1.25;font-weight:700;color:#0f172a;">
          ${escapeHtml(data.title)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:16px;line-height:1.65;color:#334155;">
          ${renderMultilineHtml(data.lead)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:15px;line-height:1.75;color:#475569;">
          ${renderMultilineHtml(data.content)}
        </td>
      </tr>
      ${
        hasCta
          ? `
        <tr>
          <td>${buildButtonHtml(data.ctaLabel, data.ctaUrl)}</td>
        </tr>
      `
          : ""
      }
    </table>
  `;

  const text = [
    data.title,
    "",
    data.lead,
    "",
    data.content,
    hasCta ? "" : null,
    hasCta ? `${data.ctaLabel}: ${data.ctaUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { bodyHtml, text };
}

function renderEventTemplate(data: Record<string, string>) {
  const locationTrimmed = data.location?.trim() ?? "";
  const locationBlock = locationTrimmed
    ? `
      <tr>
        <td style="padding-top:8px;font-size:15px;line-height:1.55;color:#475569;">
          <strong style="color:#0f172a;">Loc:</strong> ${escapeHtml(locationTrimmed)}
        </td>
      </tr>`
    : "";

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:7px 11px;border-radius:999px;background:#fff7ed;color:#c2410c;font-size:12px;line-height:1.2;font-weight:700;">
                Eveniment
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:28px;line-height:1.25;font-weight:700;color:#0f172a;">
          ${escapeHtml(data.title)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:10px;font-size:15px;line-height:1.55;color:#475569;">
          <strong style="color:#0f172a;">Când:</strong> ${escapeHtml(data.eventDatetime)}
        </td>
      </tr>
      ${locationBlock}
      <tr>
        <td style="padding-top:14px;font-size:15px;line-height:1.75;color:#475569;">
          ${renderMultilineHtml(data.description)}
        </td>
      </tr>
      <tr>
        <td>${buildButtonHtml(data.ctaLabel, data.ctaUrl)}</td>
      </tr>
    </table>
  `;

  const text = [
    `[Eveniment] ${data.title}`,
    "",
    `Când: ${data.eventDatetime}`,
    locationTrimmed ? `Loc: ${locationTrimmed}` : null,
    "",
    data.description,
    "",
    `${data.ctaLabel}: ${data.ctaUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { bodyHtml, text };
}

function renderPromoTemplate(data: Record<string, string>) {
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:7px 11px;border-radius:999px;background:#fff7ed;color:#c2410c;font-size:12px;line-height:1.2;font-weight:700;letter-spacing:.02em;">
                ${escapeHtml(data.badgeText)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:30px;line-height:1.2;font-weight:700;color:#0f172a;">
          ${escapeHtml(data.title)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:15px;line-height:1.75;color:#475569;">
          ${renderMultilineHtml(data.offerDetails)}
        </td>
      </tr>
      ${
        data.promoCode
          ? `
        <tr>
          <td style="padding-top:16px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px dashed #d97706;border-radius:12px;background:#fff7ed;">
              <tr>
                <td style="padding:14px;">
                  <p style="margin:0 0 6px 0;font-size:12px;line-height:1.2;color:#9a3412;">Cod promo</p>
                  <p style="margin:0;font-size:20px;line-height:1.2;font-weight:700;color:#9a3412;letter-spacing:0.03em;">
                    ${escapeHtml(data.promoCode)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
          : ""
      }
      ${
        data.deadline
          ? `
        <tr>
          <td style="padding-top:12px;font-size:13px;line-height:1.5;color:#64748b;">
            ${escapeHtml(data.deadline)}
          </td>
        </tr>
      `
          : ""
      }
      <tr>
        <td>${buildButtonHtml(data.ctaLabel, data.ctaUrl)}</td>
      </tr>
    </table>
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
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:7px 11px;border-radius:999px;background:${style.badgeBg};color:${style.badgeColor};font-size:12px;line-height:1.2;font-weight:700;">
                ${style.badgeLabel}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;font-size:28px;line-height:1.25;font-weight:700;color:#0f172a;">
          ${escapeHtml(data.title)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${style.borderColor};border-radius:12px;background:#f8fafc;">
            <tr>
              <td style="padding:14px;">
                <p style="margin:0 0 8px 0;font-size:12px;line-height:1.2;font-weight:700;color:#64748b;text-transform:uppercase;">
                  Ce s-a schimbat
                </p>
                <p style="margin:0;font-size:15px;line-height:1.75;color:#334155;">
                  ${renderMultilineHtml(data.whatChanged)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
            <tr>
              <td style="padding:14px;">
                <p style="margin:0 0 8px 0;font-size:12px;line-height:1.2;font-weight:700;color:#64748b;text-transform:uppercase;">
                  Acțiune necesară
                </p>
                <p style="margin:0;font-size:15px;line-height:1.75;color:#334155;">
                  ${renderMultilineHtml(data.actionRequired)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>${buildButtonHtml(data.ctaLabel, data.ctaUrl)}</td>
      </tr>
    </table>
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
      let value = trimString(templateData[field.key]);
      if (field.type === "url" && value) {
        value = coerceAbsoluteHttpUrl(value);
      }
      normalized[field.key] = value;
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

  const optionalCtaPairTemplates: CampaignTemplateId[] = [
    "updates",
    "general",
    "recommendations",
    "informative",
    "providers",
  ];
  if (optionalCtaPairTemplates.includes(input.templateId)) {
    const hasLabel = Boolean(normalizedData.ctaLabel);
    const hasUrl = Boolean(normalizedData.ctaUrl);
    if (hasLabel !== hasUrl) {
      errors.push(
        "Completează atât textul butonului cât și linkul, sau lasă ambele câmpuri goale."
      );
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
  switch (input.templateId) {
    case "updates":
    case "general":
      templateOutput = renderUpdatesTemplate(data);
      break;
    case "recommendations":
      templateOutput = renderUpdatesTemplate(data, { highlightsHeading: "Recomandări" });
      break;
    case "promo":
      templateOutput = renderPromoTemplate(data);
      break;
    case "alert":
      templateOutput = renderAlertTemplate(data);
      break;
    case "informative":
    case "providers":
      templateOutput = renderInformativeTemplate(data);
      break;
    case "event":
      templateOutput = renderEventTemplate(data);
      break;
    default: {
      const _exhaustive: never = input.templateId;
      throw new Error(`Unhandled template: ${_exhaustive}`);
    }
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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

export const SMTP_HOST = defineSecret("SMTP_HOST");
export const SMTP_PORT = defineSecret("SMTP_PORT");
export const SMTP_SECURE = defineSecret("SMTP_SECURE");
export const SMTP_USER = defineSecret("SMTP_USER");
export const SMTP_PASS = defineSecret("SMTP_PASS");
export const NEWSLETTER_FROM_NAME = defineSecret("NEWSLETTER_FROM_NAME");
export const NEWSLETTER_FROM_EMAIL = defineSecret("NEWSLETTER_FROM_EMAIL");
export const NEWSLETTER_REPLY_TO = defineSecret("NEWSLETTER_REPLY_TO");
export const PUBLIC_BASE_URL = defineSecret("PUBLIC_BASE_URL");

let cachedTransport: nodemailer.Transporter | null = null;
let cachedInlineLogoBuffer: Buffer | null = null;

const INLINE_LOGO_CID = "ainevoie-logo";
const LOGO_IMAGE_REGEX =
  /src="[^"]*\/images\/logo\/logo(?:-email)?\.(?:png|svg)(?:\?[^"]*)?"/i;

function getRequiredSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required secret: ${name}`);
  }
  return value;
}

function resolveSecureFlag(port: number, value?: string): boolean {
  const secureRaw = value?.trim();
  if (!secureRaw) {
    return port === 465;
  }

  const secure = secureRaw.toLowerCase();
  if (secure === "true") {
    return true;
  }
  if (secure === "false") {
    return false;
  }

  throw new Error(
    `Invalid SMTP_SECURE value: "${secureRaw}". Use "true" or "false".`
  );
}

function getTransport(): nodemailer.Transporter {
  if (cachedTransport) {
    return cachedTransport;
  }

  const host = getRequiredSecret(SMTP_HOST.value(), "SMTP_HOST");
  const port = Number(getRequiredSecret(SMTP_PORT.value(), "SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid SMTP_PORT value: "${SMTP_PORT.value()}"`);
  }
  const secure = resolveSecureFlag(port, SMTP_SECURE.value());
  const user = getRequiredSecret(SMTP_USER.value(), "SMTP_USER");
  const pass = getRequiredSecret(SMTP_PASS.value(), "SMTP_PASS");

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransport;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function insertPreviewText(html: string, previewText?: string): string {
  if (!previewText) {
    return html;
  }

  const hidden = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${previewText}</div>`;
  if (html.includes("<body")) {
    return html.replace(/<body[^>]*>/i, (match) => `${match}${hidden}`);
  }

  return `${hidden}${html}`;
}

export function buildUnsubscribeUrl(token: string, baseUrlOverride?: string): string {
  const baseUrl = baseUrlOverride || PUBLIC_BASE_URL.value();
  if (!baseUrl) {
    throw new Error("Missing required secret: PUBLIC_BASE_URL");
  }
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/unsubscribe?token=${encodeURIComponent(token)}`;
}

function appendFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;border-top:1px solid #e2e8f0;">
      <tr>
        <td style="padding:14px 20px 0 20px;font-size:12px;line-height:1.6;color:#64748b;">
          Primești acest email deoarece te-ai înscris pe lista Ainevoie.
          <br />
          Dacă nu mai dorești să primești mesaje, te poți dezabona:
          <a href="${unsubscribeUrl}" style="color:#d35400;font-weight:700;">Dezabonare</a>
        </td>
      </tr>
    </table>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }

  return `${html}${footer}`;
}

function inlineLogoIfPossible(html: string): {
  html: string;
  inlineLogoUsed: boolean;
} {
  if (!LOGO_IMAGE_REGEX.test(html)) {
    return { html, inlineLogoUsed: false };
  }

  const replacedHtml = html.replace(LOGO_IMAGE_REGEX, `src="cid:${INLINE_LOGO_CID}"`);
  return { html: replacedHtml, inlineLogoUsed: replacedHtml !== html };
}

function getInlineLogoAttachment():
  | { filename: string; content: Buffer; cid: string }
  | null {
  if (cachedInlineLogoBuffer) {
    return {
      filename: "logo-email.png",
      content: cachedInlineLogoBuffer,
      cid: INLINE_LOGO_CID,
    };
  }

  const logoPath = join(process.cwd(), "src", "assets", "logo-email.png");
  if (!existsSync(logoPath)) {
    return null;
  }

  cachedInlineLogoBuffer = readFileSync(logoPath);
  return {
    filename: "logo-email.png",
    content: cachedInlineLogoBuffer,
    cid: INLINE_LOGO_CID,
  };
}

export async function sendNewsletterEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  unsubscribeUrl: string;
}) {
  const transport = getTransport();
  const fromEmail = getRequiredSecret(
    options.fromEmail || NEWSLETTER_FROM_EMAIL.value(),
    "NEWSLETTER_FROM_EMAIL"
  );
  const fromName = options.fromName || NEWSLETTER_FROM_NAME.value() || "";

  const from = fromName
    ? `\"${fromName}\" <${fromEmail}>`
    : fromEmail;

  const htmlWithPreview = insertPreviewText(options.html, options.previewText);
  const htmlWithFooter = appendFooter(htmlWithPreview, options.unsubscribeUrl);
  const inlineLogoResult = inlineLogoIfPossible(htmlWithFooter);
  const textContent = options.text || stripHtml(inlineLogoResult.html);
  const logoAttachment = inlineLogoResult.inlineLogoUsed
    ? getInlineLogoAttachment()
    : null;

  return transport.sendMail({
    to: options.to,
    from,
    replyTo: options.replyTo || NEWSLETTER_REPLY_TO.value() || undefined,
    subject: options.subject,
    text: textContent,
    html: inlineLogoResult.html,
    attachments: logoAttachment ? [logoAttachment] : undefined,
    headers: {
      "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

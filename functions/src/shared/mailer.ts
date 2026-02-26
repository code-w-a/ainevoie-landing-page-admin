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
    <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb"/>
    <p style="font-size:12px;line-height:1.5;color:#6b7280;margin:16px 0 0">
      Primești acest email deoarece te-ai înscris pe lista AInevoie.
      <br />
      Dacă nu mai dorești să primești mesaje, te poți dezabona aici:
      <a href="${unsubscribeUrl}" style="color:#2563eb">Dezabonare</a>
    </p>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }

  return `${html}${footer}`;
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
  const textContent = options.text || stripHtml(htmlWithFooter);

  return transport.sendMail({
    to: options.to,
    from,
    replyTo: options.replyTo || NEWSLETTER_REPLY_TO.value() || undefined,
    subject: options.subject,
    text: textContent,
    html: htmlWithFooter,
    headers: {
      "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

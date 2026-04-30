import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { captureServerException } from "@/lib/sentryServer";

type ContactPayload = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  message?: string;
  locale?: string;
};

const DEFAULT_CONTACT_EMAIL = "contact@ai-nevoie.ro";
const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 5000;
type ContactLocale = "ro" | "en";

const COPY: Record<
  ContactLocale,
  {
    missingFields: string;
    invalidEmail: string;
    sendFailed: string;
    emailTitle: string;
    subjectPrefix: string;
    nameLabel: string;
    companyLabel: string;
    emailLabel: string;
    phoneLabel: string;
    messageLabel: string;
  }
> = {
  ro: {
    missingFields: "Câmpurile obligatorii lipsesc.",
    invalidEmail: "Email invalid.",
    sendFailed: "Mesajul de contact nu a putut fi trimis.",
    emailTitle: "Mesaj nou din formularul de contact AInevoie",
    subjectPrefix: "Mesaj contact AInevoie de la",
    nameLabel: "Nume",
    companyLabel: "Companie",
    emailLabel: "Email",
    phoneLabel: "Telefon",
    messageLabel: "Mesaj",
  },
  en: {
    missingFields: "Required fields are missing.",
    invalidEmail: "Invalid email.",
    sendFailed: "Contact message could not be sent.",
    emailTitle: "New message from the AInevoie contact form",
    subjectPrefix: "AInevoie contact message from",
    nameLabel: "Name",
    companyLabel: "Company",
    emailLabel: "Email",
    phoneLabel: "Phone",
    messageLabel: "Message",
  },
};

function normalizeString(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveContactEmail() {
  return process.env.CONTACT_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;
}

function resolveLocale(value: unknown): ContactLocale {
  return value === "en" ? "en" : "ro";
}

function buildText(data: Required<Omit<ContactPayload, "locale">>, copy: typeof COPY.ro) {
  return [
    copy.emailTitle,
    "",
    `${copy.nameLabel}: ${data.name}`,
    `${copy.companyLabel}: ${data.company || "-"}`,
    `${copy.emailLabel}: ${data.email}`,
    `${copy.phoneLabel}: ${data.phone || "-"}`,
    "",
    `${copy.messageLabel}:`,
    data.message,
  ].join("\n");
}

function buildHtml(data: Required<Omit<ContactPayload, "locale">>, copy: typeof COPY.ro) {
  const rows = [
    [copy.nameLabel, data.name],
    [copy.companyLabel, data.company || "-"],
    [copy.emailLabel, data.email],
    [copy.phoneLabel, data.phone || "-"],
  ];

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <h2>${escapeHtml(copy.emailTitle)}</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="font-weight:700;border:1px solid #e5e7eb">${escapeHtml(label)}</td>
                <td style="border:1px solid #e5e7eb">${escapeHtml(value)}</td>
              </tr>
            `
          )
          .join("")}
      </table>
      <h3>${escapeHtml(copy.messageLabel)}</h3>
      <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
    </div>
  `;
}

export async function POST(request: Request) {
  let locale: ContactLocale = "ro";
  try {
    const body = (await request.json()) as ContactPayload;
    const name = normalizeString(body.name);
    const company = normalizeString(body.company);
    const email = normalizeString(body.email).toLowerCase();
    const phone = normalizeString(body.phone);
    const message = normalizeString(body.message, MAX_MESSAGE_LENGTH);
    locale = resolveLocale(body.locale);
    const copy = COPY[locale];

    if (!name || !email || !message) {
      return NextResponse.json({ error: copy.missingFields }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: copy.invalidEmail }, { status: 400 });
    }

    const data = { name, company, email, phone, message };

    await sendEmail({
      to: resolveContactEmail(),
      replyTo: email,
      subject: `${copy.subjectPrefix} ${name}`,
      text: buildText(data, copy),
      html: buildHtml(data, copy),
    });

    return NextResponse.json({ status: "sent" }, { status: 200 });
  } catch (error) {
    captureServerException(error, { route: "api/contact/route.ts" });
    return NextResponse.json(
      { error: COPY[locale].sendFailed },
      { status: 500 }
    );
  }
}

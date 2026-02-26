import { HttpsError, onCall } from "firebase-functions/v2/https";
import { REGION } from "./constants";
import { ADMIN_API_KEY, requireAdmin } from "../shared/auth";
import {
  NEWSLETTER_FROM_EMAIL,
  NEWSLETTER_FROM_NAME,
  NEWSLETTER_REPLY_TO,
  PUBLIC_BASE_URL,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  buildUnsubscribeUrl,
  sendNewsletterEmail,
} from "../shared/mailer";
import {
  generateToken,
  getDb,
  getNewsletterSettings,
  logNewsletterEvent,
} from "../shared/firestore";

export const sendNewsletterTestEmail = onCall(
  {
    region: REGION,
    invoker: "public",
    secrets: [
      ADMIN_API_KEY,
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      NEWSLETTER_FROM_NAME,
      NEWSLETTER_FROM_EMAIL,
      NEWSLETTER_REPLY_TO,
      PUBLIC_BASE_URL,
    ],
  },
  async (request) => {
    requireAdmin(request);

    const { toEmail, subject, html, text, previewText, fromName, fromEmail } =
      request.data ?? {};

    if (!toEmail || typeof toEmail !== "string") {
      throw new HttpsError("invalid-argument", "Lipsește toEmail.");
    }

    if (!subject || typeof subject !== "string") {
      throw new HttpsError("invalid-argument", "Lipsește subject.");
    }

    if (!html || typeof html !== "string") {
      throw new HttpsError("invalid-argument", "Lipsește html.");
    }

    const token = generateToken();
    const settings = await getNewsletterSettings(getDb());
    const unsubscribeUrl = buildUnsubscribeUrl(token, settings?.baseUrl);

    await sendNewsletterEmail({
      to: toEmail.trim().toLowerCase(),
      subject,
      html,
      text: typeof text === "string" ? text : undefined,
      previewText: typeof previewText === "string" ? previewText : undefined,
      fromName: typeof fromName === "string" ? fromName : undefined,
      fromEmail: typeof fromEmail === "string" ? fromEmail : undefined,
      replyTo: settings?.replyTo || NEWSLETTER_REPLY_TO.value() || undefined,
      unsubscribeUrl,
    });

    const db = getDb();
    await logNewsletterEvent(db, {
      level: "info",
      email: toEmail,
      message: "Emailul de test a fost trimis.",
    });

    return { status: "ok" };
  }
);

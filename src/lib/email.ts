import nodemailer from "nodemailer";
import { createHash, randomUUID } from "node:crypto";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

type EmailSendContext = {
  channel?: string;
  templateKind?: string;
  requestId?: string;
  correlationId?: string;
  route?: string;
  providerId?: string;
  action?: string;
  statusFrom?: string;
  statusTo?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransportKey = "";
const LOG_PREFIX = "[email]";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required email env: ${name}`);
  }
  return value;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid EMAIL_SERVER_PORT value: "${value}"`);
  }
  return port;
}

function resolveSecureFlag(port: number): boolean {
  const secureRaw = process.env.EMAIL_SERVER_SECURE?.trim();
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
    `Invalid EMAIL_SERVER_SECURE value: "${secureRaw}". Use "true" or "false".`
  );
}

function getSmtpConfig(): SmtpConfig {
  const host = getRequiredEnv("EMAIL_SERVER_HOST");
  const port = parsePort(getRequiredEnv("EMAIL_SERVER_PORT"));
  const secure = resolveSecureFlag(port);
  const user = getRequiredEnv("EMAIL_SERVER_USER");
  const pass = getRequiredEnv("EMAIL_SERVER_PASSWORD");
  const from = getRequiredEnv("EMAIL_FROM");

  return { host, port, secure, user, pass, from };
}

function parseOptionalTimeout(name: string, fallbackMs: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallbackMs;

  const timeout = Number(raw);
  if (!Number.isInteger(timeout) || timeout < 1000) {
    throw new Error(`Invalid ${name} value: "${raw}"`);
  }
  return timeout;
}

function getTransporter(config: SmtpConfig): nodemailer.Transporter {
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (cachedTransporter && cachedTransportKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: parseOptionalTimeout("EMAIL_CONNECTION_TIMEOUT_MS", 10000),
    greetingTimeout: parseOptionalTimeout("EMAIL_GREETING_TIMEOUT_MS", 10000),
    socketTimeout: parseOptionalTimeout("EMAIL_SOCKET_TIMEOUT_MS", 20000),
  });
  cachedTransportKey = key;

  return cachedTransporter;
}

function maskEmail(value: string): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  const [localPartRaw, domainPartRaw] = normalized.split("@");
  const localPart = localPartRaw || "";
  const domainPart = domainPartRaw || "";

  if (!domainPart) {
    if (localPart.length <= 2) {
      return `${localPart[0] || "*"}***`;
    }
    return `${localPart.slice(0, 2)}***`;
  }

  const visibleLocal = localPart.slice(0, 2) || localPart.slice(0, 1) || "*";
  return `${visibleLocal}***@${domainPart}`;
}

function hashEmail(value: string): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return createHash("sha256").update(normalized).digest("hex");
}

function getAcceptedCount(info: nodemailer.SentMessageInfo): number {
  if (!Array.isArray(info.accepted)) {
    return 0;
  }

  return info.accepted.length;
}

function getRejectedCount(info: nodemailer.SentMessageInfo): number {
  if (!Array.isArray(info.rejected)) {
    return 0;
  }

  return info.rejected.length;
}

function readErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }

  return "UNKNOWN";
}

function readErrorResponseCode(error: unknown): number | null {
  const responseCode = (error as { responseCode?: unknown })?.responseCode;
  if (typeof responseCode === "number" && Number.isFinite(responseCode)) {
    return responseCode;
  }

  return null;
}

function readErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim().slice(0, 500);
}

export const sendEmail = async (data: EmailPayload, context: EmailSendContext = {}) => {
  const smtpConfig = getSmtpConfig();
  const transporter = getTransporter(smtpConfig);
  const startedAt = Date.now();
  const requestId = context.requestId || randomUUID();
  const recipientMasked = maskEmail(data.to);
  const recipientHash = hashEmail(data.to);
  const channel = context.channel || "generic";
  const templateKind = context.templateKind || null;

  console.info(`${LOG_PREFIX} email_send_start`, {
    event: "email_send_start",
    channel,
    templateKind,
    requestId,
    correlationId: context.correlationId || null,
    route: context.route || null,
    providerId: context.providerId || null,
    action: context.action || null,
    statusFrom: context.statusFrom || null,
    statusTo: context.statusTo || null,
    recipientMasked,
    recipientHash,
    smtpHost: smtpConfig.host,
    smtpPort: smtpConfig.port,
    secure: smtpConfig.secure,
  });

  try {
    const info = await transporter.sendMail({
      from: smtpConfig.from,
      ...data,
    });

    console.info(`${LOG_PREFIX} email_send_success`, {
      event: "email_send_success",
      channel,
      templateKind,
      requestId,
      correlationId: context.correlationId || null,
      route: context.route || null,
      providerId: context.providerId || null,
      action: context.action || null,
      statusFrom: context.statusFrom || null,
      statusTo: context.statusTo || null,
      recipientMasked,
      recipientHash,
      smtpHost: smtpConfig.host,
      smtpPort: smtpConfig.port,
      secure: smtpConfig.secure,
      durationMs: Date.now() - startedAt,
      messageId: info.messageId || null,
      acceptedCount: getAcceptedCount(info),
      rejectedCount: getRejectedCount(info),
    });

    return info;
  } catch (error) {
    console.error(`${LOG_PREFIX} email_send_failure`, {
      event: "email_send_failure",
      channel,
      templateKind,
      requestId,
      correlationId: context.correlationId || null,
      route: context.route || null,
      providerId: context.providerId || null,
      action: context.action || null,
      statusFrom: context.statusFrom || null,
      statusTo: context.statusTo || null,
      recipientMasked,
      recipientHash,
      smtpHost: smtpConfig.host,
      smtpPort: smtpConfig.port,
      secure: smtpConfig.secure,
      durationMs: Date.now() - startedAt,
      errorCode: readErrorCode(error),
      responseCode: readErrorResponseCode(error),
      errorMessage: readErrorMessage(error),
    });
    throw error;
  }
};

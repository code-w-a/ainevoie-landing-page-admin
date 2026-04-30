import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
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

export const sendEmail = async (data: EmailPayload) => {
  const smtpConfig = getSmtpConfig();
  const transporter = getTransporter(smtpConfig);

  return await transporter.sendMail({
    from: smtpConfig.from,
    ...data,
  });
};

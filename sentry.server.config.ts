import * as Sentry from "@sentry/nextjs";

if (
  process.env.DISABLE_SENTRY !== "true" &&
  process.env.NEXT_PUBLIC_DISABLE_SENTRY !== "true"
) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    includeLocalVariables: true,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
  });
}

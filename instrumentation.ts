import * as Sentry from "@sentry/nextjs";

const isSentryDisabled =
  process.env.DISABLE_SENTRY === "true" ||
  process.env.NEXT_PUBLIC_DISABLE_SENTRY === "true";

export async function register() {
  if (isSentryDisabled) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = isSentryDisabled ?
  undefined
: Sentry.captureRequestError;

import * as Sentry from "@sentry/node";
import { HttpsError } from "firebase-functions/v2/https";

type SentryContext = {
  handler: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

const FLUSH_TIMEOUT_MS = 2000;
let initialized = false;

function initSentry() {
  if (initialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    initialized = true;
    return;
  }

  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
  });

  initialized = true;
}

function shouldIgnoreError(error: unknown): boolean {
  if (!(error instanceof HttpsError)) {
    return false;
  }

  return [
    "invalid-argument",
    "permission-denied",
    "failed-precondition",
    "not-found",
    "already-exists",
    "unauthenticated",
  ].includes(error.code);
}

export async function captureFunctionException(
  error: unknown,
  context: SentryContext
): Promise<void> {
  initSentry();

  if (shouldIgnoreError(error)) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("surface", "firebase-functions");
    scope.setTag("handler", context.handler);

    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }

    Sentry.captureException(new Error(String(error)));
  });

  await Sentry.flush(FLUSH_TIMEOUT_MS);
}

export function withSentryFunction<TArgs extends unknown[], TResult>(
  handlerName: string,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    initSentry();

    try {
      return await handler(...args);
    } catch (error) {
      await captureFunctionException(error, { handler: handlerName });
      throw error;
    }
  };
}

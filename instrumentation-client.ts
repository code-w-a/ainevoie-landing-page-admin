import * as Sentry from "@sentry/nextjs";

const isSentryDisabled = process.env.NEXT_PUBLIC_DISABLE_SENTRY === "true";

if (!isSentryDisabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    replaysSessionSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
    integrations: [Sentry.replayIntegration()],
  });
}

export const onRouterTransitionStart = isSentryDisabled ?
  undefined
: Sentry.captureRouterTransitionStart;

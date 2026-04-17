import * as Sentry from "@sentry/nextjs";

type CaptureContext = {
  route: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

function isExpectedBusinessError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.trim().toLowerCase();
  return ["missing_token", "not_admin", "email-already-exists"].includes(message);
}

export function captureServerException(error: unknown, context: CaptureContext): void {
  if (isExpectedBusinessError(error)) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("surface", "next-server");
    scope.setTag("route", context.route);

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
}

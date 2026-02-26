function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizePayload<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map((item) => sanitizePayload(item))
      .filter((item) => typeof item !== "undefined") as T;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  const entries = Object.entries(input)
    .map(([key, value]) => [key, sanitizePayload(value)] as const)
    .filter(([, value]) => typeof value !== "undefined")
    .filter(([, value]) => !isPlainObject(value) || Object.keys(value).length > 0);

  return Object.fromEntries(entries) as T;
}

type CallableErrorShape = {
  error?: string | { message?: string };
};

export async function parseCallableErrorResponse(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const json = (await response.clone().json()) as CallableErrorShape;
    if (typeof json?.error === "string" && json.error.trim()) {
      return json.error;
    }
    if (
      json?.error &&
      typeof json.error === "object" &&
      typeof json.error.message === "string" &&
      json.error.message.trim()
    ) {
      return json.error.message;
    }
  } catch {
    // noop
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // noop
  }

  return fallback;
}

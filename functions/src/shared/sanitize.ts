function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeFirestorePayload<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map((item) => sanitizeFirestorePayload(item))
      .filter((item) => typeof item !== "undefined") as T;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  const entries = Object.entries(input)
    .map(([key, value]) => [key, sanitizeFirestorePayload(value)] as const)
    .filter(([, value]) => typeof value !== "undefined")
    .filter(([, value]) =>
      !isPlainObject(value) || Object.keys(value).length > 0
    );

  return Object.fromEntries(entries) as T;
}

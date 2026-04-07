const LOCALE = "ro-RO";
const TIMEZONE = "Europe/Bucharest";

export type FormatAdminDateTimeOptions = {
  /** Include seconds (useful for dense log timelines). Default: false. */
  includeSeconds?: boolean;
};

function parseToDate(value: unknown): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats API / ISO timestamps for admin tables and cards (Bucharest, Romanian labels).
 * Returns "-" for missing or invalid values.
 */
export function formatAdminDateTime(
  value: unknown,
  options?: FormatAdminDateTimeOptions
): string {
  const d = parseToDate(value);
  if (!d) {
    return "-";
  }

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(options?.includeSeconds ? { second: "2-digit" } : {}),
  }).format(d);
}

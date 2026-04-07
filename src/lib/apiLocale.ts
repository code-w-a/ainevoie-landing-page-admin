export type AppLocale = "ro" | "en";

/**
 * Resolves locale for API responses: prefers `x-next-intl-locale` from the
 * client, then `Accept-Language`, default `ro`.
 */
export function getRequestLocale(request: Request): AppLocale {
  const fromClient = request.headers.get("x-next-intl-locale");
  if (fromClient === "en" || fromClient === "ro") {
    return fromClient;
  }

  const accept = request.headers.get("accept-language") || "";
  const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("en")) {
    return "en";
  }

  return "ro";
}

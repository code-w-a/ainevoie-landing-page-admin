import en from "../../messages/en.json";
import ro from "../../messages/ro.json";
import type { AppLocale } from "./apiLocale";

const bundles = { ro, en } as const;

export function getApiErrorMessage(locale: AppLocale, code: string): string {
  const api = bundles[locale].ApiErrors as Record<string, string> | undefined;
  const msg = api?.[code];
  if (typeof msg === "string" && msg.length > 0) {
    return msg;
  }
  const fallback = (bundles.ro.ApiErrors as Record<string, string>)?.[code];
  return typeof fallback === "string" ? fallback : code;
}

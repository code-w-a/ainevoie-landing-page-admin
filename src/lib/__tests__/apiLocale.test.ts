import { describe, expect, it } from "vitest";
import { getRequestLocale } from "../apiLocale";

function requestWithHeaders(headers: HeadersInit) {
  return new Request("https://example.com/api", { headers });
}

describe("getRequestLocale", () => {
  it("prefers the next-intl locale header", () => {
    expect(getRequestLocale(requestWithHeaders({ "x-next-intl-locale": "en" }))).toBe("en");
    expect(getRequestLocale(requestWithHeaders({ "x-next-intl-locale": "ro" }))).toBe("ro");
  });

  it("uses Accept-Language when client locale is not present", () => {
    expect(getRequestLocale(requestWithHeaders({ "accept-language": "en-US,en;q=0.9" }))).toBe(
      "en",
    );
  });

  it("falls back to Romanian", () => {
    expect(getRequestLocale(requestWithHeaders({ "accept-language": "fr-FR" }))).toBe("ro");
  });
});

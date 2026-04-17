import { describe, expect, it } from "vitest";
import validateEmail from "../validate";

describe("validateEmail", () => {
  it("accepts a standard email address", () => {
    expect(validateEmail("contact@example.com")).toBe(true);
  });

  it("rejects malformed email addresses", () => {
    expect(validateEmail("contact")).toBe(false);
    expect(validateEmail("contact@")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
  });
});

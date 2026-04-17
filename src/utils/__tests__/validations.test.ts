import { describe, expect, it } from "vitest";
import { emailValidation, passwordValidation } from "../validations";

describe("auth validations", () => {
  it("accepts an email-like value", () => {
    expect(emailValidation("user@example.com")).toBe(true);
  });

  it("rejects values without an at sign", () => {
    expect(emailValidation("user.example.com")).toBe(false);
  });

  it("requires uppercase, lowercase, number and special character for passwords", () => {
    expect(passwordValidation("Passw0rd!")).toBe(true);
    expect(passwordValidation("password!")).toBe(false);
    expect(passwordValidation("PASSWORD!")).toBe(false);
    expect(passwordValidation("Password")).toBe(false);
    expect(passwordValidation("Password1")).toBe(false);
  });
});

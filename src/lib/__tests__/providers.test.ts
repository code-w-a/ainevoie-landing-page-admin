import { describe, expect, it } from "vitest";
import {
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  isProviderCityOption,
  isProviderLegalStatus,
  isProviderServiceOption,
  isProviderStatus,
  providerStatusVariant,
} from "../providers";

describe("provider helpers", () => {
  it("validates canonical provider statuses", () => {
    expect(isProviderStatus("new")).toBe(true);
    expect(isProviderStatus("approved")).toBe(true);
    expect(isProviderStatus("archived")).toBe(false);
  });

  it("validates canonical legal statuses", () => {
    expect(isProviderLegalStatus("pfa_ready")).toBe(true);
    expect(isProviderLegalStatus("need_guidance")).toBe(true);
    expect(isProviderLegalStatus("company_ready")).toBe(false);
  });

  it("matches city and service options case-insensitively", () => {
    expect(isProviderCityOption(" bucuresti ")).toBe(true);
    expect(isProviderCityOption("Oradea")).toBe(true);
    expect(isProviderServiceOption(" curatenie birouri ")).toBe(true);
    expect(isProviderCityOption("Atlantis")).toBe(false);
    expect(isProviderServiceOption("Instalatii")).toBe(false);
  });

  it("maps provider statuses to badge variants", () => {
    expect(providerStatusVariant("approved")).toBe("success");
    expect(providerStatusVariant("rejected")).toBe("danger");
    expect(providerStatusVariant("in_review")).toBe("warning");
    expect(providerStatusVariant("new")).toBe("outline");
  });

  it("detects legal consent completeness", () => {
    expect(
      getProviderLegalConsentState({
        termsVersion: "v1",
        privacyVersion: "v1",
      }),
    ).toBe("accepted");
    expect(getProviderLegalConsentState({ termsVersion: "v1" })).toBe("partial");
    expect(getProviderLegalConsentState({})).toBe("missing");
  });

  it("detects launch contact consent state", () => {
    expect(getProviderLaunchContactConsentState({ launchContactConsent: true })).toBe(
      "accepted",
    );
    expect(getProviderLaunchContactConsentState({ launchContactConsent: false })).toBe(
      "declined",
    );
    expect(getProviderLaunchContactConsentState({})).toBe("missing");
  });
});

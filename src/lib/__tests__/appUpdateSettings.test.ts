import { describe, expect, it } from "vitest";
import {
  getDefaultAppUpdateSettings,
  getPublicAppUpdateSettings,
  sanitizeAppUpdateSettings,
  validateAppUpdateSettings,
} from "../appUpdateSettings";

describe("app update settings", () => {
  it("returns disabled defaults when config is missing", () => {
    const settings = sanitizeAppUpdateSettings(null);

    expect(settings.enabled).toBe(false);
    expect(settings.paymentDemoModeEnabled).toBe(false);
    expect(settings.platformFeePercent).toBe(20);
    expect(settings.mode).toBe("notice");
    expect(settings.title.ro).toBe(getDefaultAppUpdateSettings().title.ro);
  });

  it("rejects enabled configs without a valid update URL", () => {
    const settings = sanitizeAppUpdateSettings({
      enabled: true,
      mode: "force",
      urls: {
        ios: "javascript:alert(1)",
        android: "",
        fallback: "",
      },
    });

    expect(validateAppUpdateSettings(settings)).toMatch(/URL valid/);
  });

  it("keeps only public fields in the public payload", () => {
    const settings = sanitizeAppUpdateSettings({
      enabled: true,
      paymentDemoModeEnabled: true,
      platformFeePercent: 12.5,
      mode: "notice",
      secret: "internal",
      urls: {
        fallback: "https://ainevoie.ro/update",
      },
    });
    const publicSettings = getPublicAppUpdateSettings(settings);

    expect(publicSettings.enabled).toBe(true);
    expect(publicSettings.paymentDemoModeEnabled).toBe(true);
    expect(publicSettings.platformFeePercent).toBe(12.5);
    expect(publicSettings.urls.fallback).toBe("https://ainevoie.ro/update");
    expect(publicSettings).not.toHaveProperty("secret");
  });
});

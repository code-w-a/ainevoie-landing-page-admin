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

  it("keeps valid semver min versions and drops invalid ones", () => {
    const settings = sanitizeAppUpdateSettings({
      enabled: true,
      minVersionIos: "1.0.2",
      minVersionAndroid: "not-a-version",
    });

    expect(settings.minVersionIos).toBe("1.0.2");
    expect(settings.minVersionAndroid).toBe("");
  });

  it("rejects enabled configs without any minimum version", () => {
    const settings = sanitizeAppUpdateSettings({
      enabled: true,
      mode: "force",
      urls: {
        fallback: "https://ainevoie.ro/update",
      },
    });

    expect(validateAppUpdateSettings(settings)).toMatch(/versiune minimă/);
  });

  it("exposes min versions in the public payload", () => {
    const settings = sanitizeAppUpdateSettings({
      enabled: true,
      minVersionIos: "1.0.2",
      minVersionAndroid: "1.1.0",
      urls: {
        fallback: "https://ainevoie.ro/update",
      },
    });
    const publicSettings = getPublicAppUpdateSettings(settings);

    expect(publicSettings.minVersionIos).toBe("1.0.2");
    expect(publicSettings.minVersionAndroid).toBe("1.1.0");
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

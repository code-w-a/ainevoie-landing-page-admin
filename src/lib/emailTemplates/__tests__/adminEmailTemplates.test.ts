import { describe, expect, it } from "vitest";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  getDefaultEmailTemplateConfig,
  mergeEmailTemplateConfig,
  renderTemplate,
} from "../adminEmailTemplates";

describe("mergeEmailTemplateConfig", () => {
  it("falls back to defaults for an empty config", () => {
    const merged = mergeEmailTemplateConfig({});
    expect(merged.prelaunchEnabled).toBe(
      EMAIL_TEMPLATE_DEFAULTS.prelaunchEnabled
    );
    expect(merged.providerWelcome.ro.subject).toBe(
      EMAIL_TEMPLATE_DEFAULTS.providerWelcome.ro.subject
    );
    expect(merged.providerApproved.en.greeting).toBe(
      EMAIL_TEMPLATE_DEFAULTS.providerApproved.en.greeting
    );
  });

  it("keeps explicit false for prelaunchEnabled toggle", () => {
    const merged = mergeEmailTemplateConfig({ prelaunchEnabled: false });
    expect(merged.prelaunchEnabled).toBe(false);
  });

  it("falls back field-by-field to defaults when partial", () => {
    const merged = mergeEmailTemplateConfig({
      providerWelcome: {
        ro: { subject: "Custom RO subiect" },
      },
    });
    expect(merged.providerWelcome.ro.subject).toBe("Custom RO subiect");
    expect(merged.providerWelcome.ro.greeting).toBe(
      EMAIL_TEMPLATE_DEFAULTS.providerWelcome.ro.greeting
    );
  });

  it("drops non-string step entries and empty strings", () => {
    const merged = mergeEmailTemplateConfig({
      providerApproved: {
        ro: {
          steps: ["pas valid", "", "  ", 42, null],
        },
      },
    });
    expect(merged.providerApproved.ro.steps).toEqual(["pas valid"]);
  });
});

describe("renderTemplate", () => {
  const baseConfig = getDefaultEmailTemplateConfig();

  it("replaces fullName and email placeholders in text and html", () => {
    const rendered = renderTemplate({
      kind: "providerApproved",
      locale: "ro",
      config: baseConfig,
      vars: { fullName: "Ana Ionescu", email: "ana@example.com" },
    });
    expect(rendered.text).toContain("Ana Ionescu");
    expect(rendered.text).toContain("ana@example.com");
    expect(rendered.html).toContain("Ana Ionescu");
    expect(rendered.html).toContain("ana@example.com");
  });

  it("escapes HTML-dangerous characters in variable values", () => {
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale: "ro",
      config: baseConfig,
      vars: {
        fullName: '<script>alert("x")</script>',
        email: "x@example.com",
      },
    });
    expect(rendered.html).not.toContain("<script>alert");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("&quot;x&quot;");
  });

  it("omits the prelaunch block when disabled", () => {
    const config = getDefaultEmailTemplateConfig();
    config.prelaunchEnabled = false;
    const rendered = renderTemplate({
      kind: "providerApproved",
      locale: "ro",
      config,
      vars: { fullName: "Test", email: "t@example.com" },
    });
    expect(rendered.html).not.toContain(
      EMAIL_TEMPLATE_DEFAULTS.prelaunch.ro.heading
    );
    expect(rendered.text).not.toContain(
      EMAIL_TEMPLATE_DEFAULTS.prelaunch.ro.heading
    );
  });

  it("includes the prelaunch block when enabled", () => {
    const rendered = renderTemplate({
      kind: "providerApproved",
      locale: "ro",
      config: baseConfig,
      vars: { fullName: "Test", email: "t@example.com" },
    });
    expect(rendered.html).toContain(
      EMAIL_TEMPLATE_DEFAULTS.prelaunch.ro.heading
    );
    expect(rendered.text).toContain(
      EMAIL_TEMPLATE_DEFAULTS.prelaunch.ro.heading
    );
  });

  it("falls back to Romanian rendering when locale is unknown", () => {
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale: "fr" as unknown as "ro",
      config: baseConfig,
      vars: { fullName: "Test", email: "t@example.com" },
    });
    expect(rendered.subject).toBe(
      EMAIL_TEMPLATE_DEFAULTS.providerWelcome.ro.subject
    );
  });
});

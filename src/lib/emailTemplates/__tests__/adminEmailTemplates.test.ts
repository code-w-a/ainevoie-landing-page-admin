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
    expect(merged.providerWelcome.ro.subject).toBe(
      EMAIL_TEMPLATE_DEFAULTS.providerWelcome.ro.subject
    );
    expect(merged.providerApproved.en.greeting).toBe(
      EMAIL_TEMPLATE_DEFAULTS.providerApproved.en.greeting
    );
  });

  it("ignores legacy prelaunch fields on the doc", () => {
    const merged = mergeEmailTemplateConfig({
      prelaunchEnabled: true,
      prelaunch: { ro: { heading: "h", body: "b" } },
    });
    expect(merged).not.toHaveProperty("prelaunchEnabled");
    expect(merged).not.toHaveProperty("prelaunch");
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

  it("preserves an explicit empty note without falling back", () => {
    const merged = mergeEmailTemplateConfig({
      providerWelcome: {
        ro: { note: "" },
      },
    });
    expect(merged.providerWelcome.ro.note).toBe("");
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

  it("omits the note block when note is empty or whitespace", () => {
    const config: typeof baseConfig = {
      providerWelcome: {
        ...baseConfig.providerWelcome,
        ro: { ...baseConfig.providerWelcome.ro, note: "   " },
      },
      providerApproved: baseConfig.providerApproved,
    };
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale: "ro",
      config,
      vars: { fullName: "Test", email: "t@example.com" },
    });
    expect(rendered.html).not.toContain("border-left:3px solid #d35400");
    expect(rendered.text.replace(baseConfig.providerWelcome.ro.signature, "")).not.toContain(
      "Momentan suntem în prelaunch",
    );
  });

  it("includes the note block when note is filled and replaces placeholders", () => {
    const config: typeof baseConfig = {
      providerWelcome: {
        ...baseConfig.providerWelcome,
        ro: {
          ...baseConfig.providerWelcome.ro,
          note: "Salut {{fullName}}, scrie la {{email}}.",
        },
      },
      providerApproved: baseConfig.providerApproved,
    };
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale: "ro",
      config,
      vars: { fullName: "Ana", email: "ana@example.com" },
    });
    expect(rendered.html).toContain("Salut Ana");
    expect(rendered.html).toContain("ana@example.com");
    expect(rendered.text).toContain("Salut Ana, scrie la ana@example.com.");
    expect(rendered.html).toContain("border-left:3px solid #d35400");
  });

  it("HTML-escapes the note content", () => {
    const config: typeof baseConfig = {
      providerWelcome: {
        ...baseConfig.providerWelcome,
        ro: {
          ...baseConfig.providerWelcome.ro,
          note: "<script>alert(1)</script>",
        },
      },
      providerApproved: baseConfig.providerApproved,
    };
    const rendered = renderTemplate({
      kind: "providerWelcome",
      locale: "ro",
      config,
      vars: { fullName: "x", email: "x@example.com" },
    });
    expect(rendered.html).not.toContain("<script>alert(1)");
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
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

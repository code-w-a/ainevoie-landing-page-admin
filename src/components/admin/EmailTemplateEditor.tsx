"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/lib/apiLocale";
import {
  EMAIL_TEMPLATE_LOCALES,
  EmailTemplateConfig,
  EmailTemplateKind,
  PrelaunchContent,
  TemplateContent,
  renderTemplate,
} from "@/lib/emailTemplates/adminEmailTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";

const PLACEHOLDER_HINT = "Placeholder-e disponibile: {{fullName}}, {{email}}";
const SAMPLE_VARS = {
  fullName: "Ion Popescu",
  email: "ion.popescu@example.com",
};

const LOCALE_LABELS: Record<AppLocale, string> = {
  ro: "Română",
  en: "Engleză",
};

type EmailTemplateEditorProps = {
  kind: EmailTemplateKind;
  content: Record<AppLocale, TemplateContent>;
  defaults: Record<AppLocale, TemplateContent>;
  prelaunch: Record<AppLocale, PrelaunchContent>;
  prelaunchEnabled: boolean;
  onChange: (next: Record<AppLocale, TemplateContent>) => void;
};

function tabTriggerClass(active: boolean): string {
  const base =
    "rounded-md px-3 py-1.5 text-sm transition border border-transparent";
  return active
    ? `${base} bg-primary text-primary-foreground`
    : `${base} bg-muted text-muted-foreground hover:bg-muted/70`;
}

export function EmailTemplateEditor({
  kind,
  content,
  defaults,
  prelaunch,
  prelaunchEnabled,
  onChange,
}: EmailTemplateEditorProps) {
  const [activeLocale, setActiveLocale] = useState<AppLocale>("ro");

  function updateLocale(
    locale: AppLocale,
    patch: Partial<TemplateContent>
  ): void {
    onChange({
      ...content,
      [locale]: { ...content[locale], ...patch },
    });
  }

  function updateStep(locale: AppLocale, index: number, value: string): void {
    const next = [...content[locale].steps];
    next[index] = value;
    updateLocale(locale, { steps: next });
  }

  function addStep(locale: AppLocale): void {
    const next = [...content[locale].steps, ""];
    updateLocale(locale, { steps: next });
  }

  function removeStep(locale: AppLocale, index: number): void {
    const next = content[locale].steps.filter((_, i) => i !== index);
    updateLocale(locale, { steps: next });
  }

  function resetLocale(locale: AppLocale): void {
    onChange({
      ...content,
      [locale]: {
        ...defaults[locale],
        steps: [...defaults[locale].steps],
      },
    });
  }

  const previewConfig = useMemo<EmailTemplateConfig>(
    () => ({
      prelaunchEnabled,
      prelaunch,
      providerWelcome:
        kind === "providerWelcome"
          ? content
          : ({} as Record<AppLocale, TemplateContent>),
      providerApproved:
        kind === "providerApproved"
          ? content
          : ({} as Record<AppLocale, TemplateContent>),
      // Only the edited kind is inspected by renderTemplate below; the other
      // kind slot is unused at render time.
    }),
    [kind, content, prelaunch, prelaunchEnabled]
  );

  const previewHtml = useMemo(() => {
    try {
      return renderTemplate({
        kind,
        locale: activeLocale,
        config: previewConfig,
        vars: SAMPLE_VARS,
      }).html;
    } catch {
      return "<p>Eroare la generarea preview-ului.</p>";
    }
  }, [activeLocale, kind, previewConfig]);

  const previewSubject = useMemo(() => {
    try {
      return renderTemplate({
        kind,
        locale: activeLocale,
        config: previewConfig,
        vars: SAMPLE_VARS,
      }).subject;
    } catch {
      return "";
    }
  }, [activeLocale, kind, previewConfig]);

  return (
    <div className="space-y-4">
      <Tabs
        value={activeLocale}
        onValueChange={(value) => setActiveLocale(value as AppLocale)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabList className="flex gap-2">
            {EMAIL_TEMPLATE_LOCALES.map((locale) => (
              <TabTrigger
                key={locale}
                value={locale}
                className={tabTriggerClass(activeLocale === locale)}
              >
                {LOCALE_LABELS[locale]}
              </TabTrigger>
            ))}
          </TabList>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => resetLocale(activeLocale)}
          >
            Resetează {LOCALE_LABELS[activeLocale]} la default
          </Button>
        </div>

        {EMAIL_TEMPLATE_LOCALES.map((locale) => (
          <TabContent key={locale} value={locale} className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subiect</label>
                  <Input
                    value={content[locale].subject}
                    onChange={(event) =>
                      updateLocale(locale, { subject: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {PLACEHOLDER_HINT}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Salut</label>
                  <Input
                    value={content[locale].greeting}
                    onChange={(event) =>
                      updateLocale(locale, { greeting: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Paragraf intro</label>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={content[locale].intro}
                    onChange={(event) =>
                      updateLocale(locale, { intro: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Pași</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStep(locale)}
                      disabled={content[locale].steps.length >= 10}
                    >
                      Adaugă pas
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {content[locale].steps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={step}
                          onChange={(event) =>
                            updateStep(locale, index, event.target.value)
                          }
                          placeholder={`Pasul ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStep(locale, index)}
                        >
                          Șterge
                        </Button>
                      </div>
                    ))}
                    {content[locale].steps.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nu există pași. Apasă &quot;Adaugă pas&quot; pentru a
                        începe.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Semnătură</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={content[locale].signature}
                    onChange={(event) =>
                      updateLocale(locale, { signature: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    O linie nouă devine rând nou în email.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Previzualizare</p>
                  <p className="text-xs text-muted-foreground">
                    Exemplu: {SAMPLE_VARS.fullName}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Subiect: {previewSubject}
                  </p>
                  <iframe
                    key={`${kind}-${locale}`}
                    title={`preview-${kind}-${locale}`}
                    className="h-[480px] w-full rounded border border-border bg-white"
                    srcDoc={previewHtml}
                    sandbox=""
                  />
                </div>
                {!prelaunchEnabled && (
                  <p className="text-xs text-muted-foreground">
                    Blocul prelaunch este dezactivat (vezi tab-ul Prelaunch).
                  </p>
                )}
              </div>
            </div>
          </TabContent>
        ))}
      </Tabs>
    </div>
  );
}

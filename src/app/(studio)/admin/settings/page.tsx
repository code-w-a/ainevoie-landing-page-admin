"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch } from "@/components/admin/adminApi";
import { AdminFormGridSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { EmailTemplateEditor } from "@/components/admin/EmailTemplateEditor";
import {
  EMAIL_TEMPLATE_LOCALES,
  EmailTemplateConfig,
  PrelaunchContent,
  TemplateContent,
  getDefaultEmailTemplateConfig,
} from "@/lib/emailTemplates/adminEmailTemplates";
import type { AppLocale } from "@/lib/apiLocale";

const TOP_TABS = {
  newsletter: "newsletter",
  templates: "templates",
} as const;

type TopTab = (typeof TOP_TABS)[keyof typeof TOP_TABS];

const TEMPLATE_TABS = {
  welcome: "welcome",
  approved: "approved",
  prelaunch: "prelaunch",
} as const;

type TemplateTab = (typeof TEMPLATE_TABS)[keyof typeof TEMPLATE_TABS];

const PRELAUNCH_LOCALE_LABELS: Record<AppLocale, string> = {
  ro: "Română",
  en: "Engleză",
};

function tabTriggerClass(active: boolean): string {
  const base =
    "rounded-md px-4 py-2 text-sm font-medium transition border border-transparent";
  return active
    ? `${base} bg-primary text-primary-foreground`
    : `${base} bg-muted text-muted-foreground hover:bg-muted/70`;
}

type EmailTemplatesResponse = {
  item: EmailTemplateConfig;
  defaults: EmailTemplateConfig;
};

export default function SettingsPage() {
  const {
    data: newsletterData,
    loading: newsletterLoading,
    error: newsletterError,
    reload: reloadNewsletter,
  } = useAdminData<{ item: Record<string, any> | null }>(
    "/api/admin/newsletter/settings"
  );
  const [newsletterState, setNewsletterState] = useState({
    fromName: "",
    fromEmail: "",
    replyTo: "",
    baseUrl: "",
    maxPerSecond: "",
    maxConcurrent: "",
  });
  const [newsletterSaving, setNewsletterSaving] = useState(false);

  useEffect(() => {
    if (newsletterData?.item) {
      setNewsletterState({
        fromName: newsletterData.item.fromName || "",
        fromEmail: newsletterData.item.fromEmail || "",
        replyTo: newsletterData.item.replyTo || "",
        baseUrl: newsletterData.item.baseUrl || "",
        maxPerSecond: newsletterData.item.maxPerSecond?.toString() || "",
        maxConcurrent: newsletterData.item.maxConcurrent?.toString() || "",
      });
    }
  }, [newsletterData]);

  async function saveNewsletter() {
    setNewsletterSaving(true);
    try {
      await adminFetch("/api/admin/newsletter/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newsletterState,
          maxPerSecond: Number(newsletterState.maxPerSecond || 0),
          maxConcurrent: Number(newsletterState.maxConcurrent || 0),
        }),
      });
      reloadNewsletter();
    } finally {
      setNewsletterSaving(false);
    }
  }

  const {
    data: templatesData,
    loading: templatesLoading,
    error: templatesError,
    reload: reloadTemplates,
  } = useAdminData<EmailTemplatesResponse>("/api/admin/email-templates");

  const fallbackDefaults = useMemo(() => getDefaultEmailTemplateConfig(), []);
  const defaults = templatesData?.defaults || fallbackDefaults;
  const [config, setConfig] = useState<EmailTemplateConfig>(fallbackDefaults);
  const [templatesSaving, setTemplatesSaving] = useState(false);
  const [templatesSaveError, setTemplatesSaveError] = useState<string | null>(
    null
  );
  const [templatesSaveOk, setTemplatesSaveOk] = useState(false);
  const [topTab, setTopTab] = useState<TopTab>(TOP_TABS.newsletter);
  const [templateTab, setTemplateTab] = useState<TemplateTab>(
    TEMPLATE_TABS.welcome
  );
  const [prelaunchLocale, setPrelaunchLocale] = useState<AppLocale>("ro");

  useEffect(() => {
    if (templatesData?.item) {
      setConfig(templatesData.item);
    }
  }, [templatesData]);

  function updateKind(
    kind: "providerWelcome" | "providerApproved",
    next: Record<AppLocale, TemplateContent>
  ) {
    setConfig((prev) => ({ ...prev, [kind]: next }));
    setTemplatesSaveOk(false);
  }

  function updatePrelaunchLocale(
    locale: AppLocale,
    patch: Partial<PrelaunchContent>
  ) {
    setConfig((prev) => ({
      ...prev,
      prelaunch: {
        ...prev.prelaunch,
        [locale]: { ...prev.prelaunch[locale], ...patch },
      },
    }));
    setTemplatesSaveOk(false);
  }

  function setPrelaunchEnabled(enabled: boolean) {
    setConfig((prev) => ({ ...prev, prelaunchEnabled: enabled }));
    setTemplatesSaveOk(false);
  }

  function resetPrelaunchLocale(locale: AppLocale) {
    setConfig((prev) => ({
      ...prev,
      prelaunch: {
        ...prev.prelaunch,
        [locale]: { ...defaults.prelaunch[locale] },
      },
    }));
    setTemplatesSaveOk(false);
  }

  async function saveTemplates() {
    setTemplatesSaving(true);
    setTemplatesSaveError(null);
    try {
      const res = await adminFetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prelaunchEnabled: config.prelaunchEnabled,
          prelaunch: config.prelaunch,
          providerWelcome: config.providerWelcome,
          providerApproved: config.providerApproved,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      await reloadTemplates();
      setTemplatesSaveOk(true);
    } catch {
      setTemplatesSaveError("Nu am putut salva template-urile.");
    } finally {
      setTemplatesSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Setări</h1>
        <p className="text-sm text-muted-foreground">
          Configurații pentru newsletter și template-urile de email.
        </p>
      </div>

      <Tabs value={topTab} onValueChange={(value) => setTopTab(value as TopTab)}>
        <TabList className="flex flex-wrap gap-2">
          <TabTrigger
            value={TOP_TABS.newsletter}
            className={tabTriggerClass(topTab === TOP_TABS.newsletter)}
          >
            Newsletter
          </TabTrigger>
          <TabTrigger
            value={TOP_TABS.templates}
            className={tabTriggerClass(topTab === TOP_TABS.templates)}
          >
            Template-uri email
          </TabTrigger>
        </TabList>

        <TabContent value={TOP_TABS.newsletter} className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil expeditor</CardTitle>
              <CardDescription>Datele folosite la trimitere.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {newsletterError && (
                <div className="md:col-span-2">
                  <p className="text-sm text-rose-500">{newsletterError}</p>
                </div>
              )}
              {newsletterLoading ? (
                <div className="md:col-span-2">
                  <AdminFormGridSkeleton fields={7} />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Nume expeditor
                    </label>
                    <Input
                      placeholder="AInevoie"
                      value={newsletterState.fromName}
                      onChange={(event) =>
                        setNewsletterState((prev) => ({
                          ...prev,
                          fromName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Email expeditor
                    </label>
                    <Input
                      placeholder="no-reply@ai-nevoie.ro"
                      value={newsletterState.fromEmail}
                      onChange={(event) =>
                        setNewsletterState((prev) => ({
                          ...prev,
                          fromEmail: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Adresă reply-to
                    </label>
                    <Input
                      placeholder="contact@ai-nevoie.ro"
                      value={newsletterState.replyTo}
                      onChange={(event) =>
                        setNewsletterState((prev) => ({
                          ...prev,
                          replyTo: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      URL public de bază
                    </label>
                    <Input
                      placeholder="https://ainevoie.ro"
                      value={newsletterState.baseUrl}
                      onChange={(event) =>
                        setNewsletterState((prev) => ({
                          ...prev,
                          baseUrl: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Maxim pe secundă
                    </label>
                    <Input
                      placeholder="5"
                      value={newsletterState.maxPerSecond}
                      onChange={(event) =>
                        setNewsletterState((prev) => ({
                          ...prev,
                          maxPerSecond: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Maxim concurent
                    </label>
                    <Input
                      placeholder="50"
                      value={newsletterState.maxConcurrent}
                      onChange={(event) =>
                        setNewsletterState((prev) => ({
                          ...prev,
                          maxConcurrent: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={saveNewsletter}
              disabled={newsletterSaving || newsletterLoading}
            >
              {newsletterSaving ? "Se salvează..." : "Salvează setările"}
            </Button>
          </div>
        </TabContent>

        <TabContent value={TOP_TABS.templates} className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template-uri email generale</CardTitle>
              <CardDescription>
                Editează subiect, salut, pași și semnătură pentru emailurile
                trimise automat prestatorilor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {templatesError && (
                <p className="text-sm text-rose-500">{templatesError}</p>
              )}
              {templatesLoading ? (
                <AdminFormGridSkeleton fields={8} />
              ) : (
                <Tabs
                  value={templateTab}
                  onValueChange={(value) =>
                    setTemplateTab(value as TemplateTab)
                  }
                >
                  <TabList className="flex flex-wrap gap-2">
                    <TabTrigger
                      value={TEMPLATE_TABS.welcome}
                      className={tabTriggerClass(
                        templateTab === TEMPLATE_TABS.welcome
                      )}
                    >
                      Welcome prestator
                    </TabTrigger>
                    <TabTrigger
                      value={TEMPLATE_TABS.approved}
                      className={tabTriggerClass(
                        templateTab === TEMPLATE_TABS.approved
                      )}
                    >
                      Aprobare prestator
                    </TabTrigger>
                    <TabTrigger
                      value={TEMPLATE_TABS.prelaunch}
                      className={tabTriggerClass(
                        templateTab === TEMPLATE_TABS.prelaunch
                      )}
                    >
                      Bloc prelaunch
                    </TabTrigger>
                  </TabList>

                  <TabContent value={TEMPLATE_TABS.welcome} className="mt-6">
                    <EmailTemplateEditor
                      kind="providerWelcome"
                      content={config.providerWelcome}
                      defaults={defaults.providerWelcome}
                      prelaunch={config.prelaunch}
                      prelaunchEnabled={config.prelaunchEnabled}
                      onChange={(next) => updateKind("providerWelcome", next)}
                    />
                  </TabContent>

                  <TabContent value={TEMPLATE_TABS.approved} className="mt-6">
                    <EmailTemplateEditor
                      kind="providerApproved"
                      content={config.providerApproved}
                      defaults={defaults.providerApproved}
                      prelaunch={config.prelaunch}
                      prelaunchEnabled={config.prelaunchEnabled}
                      onChange={(next) => updateKind("providerApproved", next)}
                    />
                  </TabContent>

                  <TabContent
                    value={TEMPLATE_TABS.prelaunch}
                    className="mt-6 space-y-4"
                  >
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={config.prelaunchEnabled}
                        onChange={(event) =>
                          setPrelaunchEnabled(event.target.checked)
                        }
                      />
                      <span className="font-medium">
                        Include blocul prelaunch (aplicație mobilă) în mailuri
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Când este bifat, blocul apare atât în mailul de welcome,
                      cât și în cel de aprobare.
                    </p>

                    <Tabs
                      value={prelaunchLocale}
                      onValueChange={(value) =>
                        setPrelaunchLocale(value as AppLocale)
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <TabList className="flex gap-2">
                          {EMAIL_TEMPLATE_LOCALES.map((locale) => (
                            <TabTrigger
                              key={locale}
                              value={locale}
                              className={tabTriggerClass(
                                prelaunchLocale === locale
                              )}
                            >
                              {PRELAUNCH_LOCALE_LABELS[locale]}
                            </TabTrigger>
                          ))}
                        </TabList>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => resetPrelaunchLocale(prelaunchLocale)}
                        >
                          Resetează {PRELAUNCH_LOCALE_LABELS[prelaunchLocale]}{" "}
                          la default
                        </Button>
                      </div>

                      {EMAIL_TEMPLATE_LOCALES.map((locale) => (
                        <TabContent
                          key={locale}
                          value={locale}
                          className="mt-4 space-y-3"
                        >
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Titlu
                            </label>
                            <Input
                              value={config.prelaunch[locale].heading}
                              onChange={(event) =>
                                updatePrelaunchLocale(locale, {
                                  heading: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Paragraf
                            </label>
                            <textarea
                              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={config.prelaunch[locale].body}
                              onChange={(event) =>
                                updatePrelaunchLocale(locale, {
                                  body: event.target.value,
                                })
                              }
                            />
                          </div>
                        </TabContent>
                      ))}
                    </Tabs>
                  </TabContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {templatesSaveError && (
              <p className="text-sm text-rose-500">{templatesSaveError}</p>
            )}
            {templatesSaveOk && !templatesSaveError && (
              <p className="text-sm text-emerald-600">Template-uri salvate.</p>
            )}
            <Button
              onClick={saveTemplates}
              disabled={templatesSaving || templatesLoading}
            >
              {templatesSaving ? "Se salvează..." : "Salvează template-urile"}
            </Button>
          </div>
        </TabContent>
      </Tabs>
    </div>
  );
}

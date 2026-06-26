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
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminFormGridSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { EmailTemplateEditor } from "@/components/admin/EmailTemplateEditor";
import {
  EmailTemplateConfig,
  TemplateContent,
  getDefaultEmailTemplateConfig,
} from "@/lib/emailTemplates/adminEmailTemplates";
import {
  AppUpdateLocale,
  AppUpdateSettings,
  getDefaultAppUpdateSettings,
} from "@/lib/appUpdateSettings";
import type { AppLocale } from "@/lib/apiLocale";

const TOP_TABS = {
  newsletter: "newsletter",
  templates: "templates",
  platformFee: "platformFee",
  appUpdate: "appUpdate",
} as const;

type TopTab = (typeof TOP_TABS)[keyof typeof TOP_TABS];

const TEMPLATE_TABS = {
  welcome: "welcome",
  approved: "approved",
} as const;

type TemplateTab = (typeof TEMPLATE_TABS)[keyof typeof TEMPLATE_TABS];

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

type AppUpdateSettingsResponse = {
  item: AppUpdateSettings;
  defaults: AppUpdateSettings;
};

const localeLabels: Record<AppUpdateLocale, string> = {
  ro: "Română",
  en: "English",
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
  const {
    data: appUpdateData,
    loading: appUpdateLoading,
    error: appUpdateError,
    reload: reloadAppUpdate,
  } = useAdminData<AppUpdateSettingsResponse>("/api/admin/app-update-settings");
  const [appUpdateState, setAppUpdateState] = useState<AppUpdateSettings>(
    getDefaultAppUpdateSettings()
  );
  const [appUpdateSaving, setAppUpdateSaving] = useState(false);
  const [appUpdateSaveError, setAppUpdateSaveError] = useState<string | null>(null);
  const [appUpdateSaveOk, setAppUpdateSaveOk] = useState(false);

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

  useEffect(() => {
    if (appUpdateData?.item) {
      setAppUpdateState(appUpdateData.item);
    }
  }, [appUpdateData]);

  function updateAppUpdateField<K extends keyof AppUpdateSettings>(
    field: K,
    value: AppUpdateSettings[K]
  ) {
    setAppUpdateState((prev) => ({ ...prev, [field]: value }));
    setAppUpdateSaveOk(false);
  }

  function updateAppUpdateLocaleField(
    field: "title" | "body" | "primaryActionLabel",
    locale: AppUpdateLocale,
    value: string
  ) {
    setAppUpdateState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [locale]: value,
      },
    }));
    setAppUpdateSaveOk(false);
  }

  function updateAppUpdateUrl(
    field: keyof AppUpdateSettings["urls"],
    value: string
  ) {
    setAppUpdateState((prev) => ({
      ...prev,
      urls: {
        ...prev.urls,
        [field]: value,
      },
    }));
    setAppUpdateSaveOk(false);
  }

  async function saveTemplates() {
    setTemplatesSaving(true);
    setTemplatesSaveError(null);
    try {
      const res = await adminFetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  async function saveAppUpdateSettings() {
    setAppUpdateSaving(true);
    setAppUpdateSaveError(null);
    try {
      const res = await adminFetch("/api/admin/app-update-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appUpdateState),
      });

      if (!res.ok) {
        throw new Error(
          await readAdminResponseError(
            res,
            "Nu am putut salva setările de actualizare."
          )
        );
      }

      const json = await res.json();
      if (json?.item) {
        setAppUpdateState(json.item);
      }
      await reloadAppUpdate();
      setAppUpdateSaveOk(true);
    } catch (error) {
      setAppUpdateSaveError(
        error instanceof Error
          ? error.message
          : "Nu am putut salva setările de actualizare."
      );
    } finally {
      setAppUpdateSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Setări</h1>
        <p className="text-sm text-muted-foreground">
          Configurații pentru newsletter, emailuri, comision platformă și experiența aplicației mobile.
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
          <TabTrigger
            value={TOP_TABS.platformFee}
            className={tabTriggerClass(topTab === TOP_TABS.platformFee)}
          >
            Comision platformă
          </TabTrigger>
          <TabTrigger
            value={TOP_TABS.appUpdate}
            className={tabTriggerClass(topTab === TOP_TABS.appUpdate)}
          >
            Actualizare aplicație
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
                      placeholder="Ainevoie"
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
                Editează subiect, salut, pași, mesajul special și semnătura
                pentru emailurile trimise automat prestatorilor.
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
                  </TabList>

                  <TabContent value={TEMPLATE_TABS.welcome} className="mt-6">
                    <EmailTemplateEditor
                      kind="providerWelcome"
                      content={config.providerWelcome}
                      defaults={defaults.providerWelcome}
                      onChange={(next) => updateKind("providerWelcome", next)}
                    />
                  </TabContent>

                  <TabContent value={TEMPLATE_TABS.approved} className="mt-6">
                    <EmailTemplateEditor
                      kind="providerApproved"
                      content={config.providerApproved}
                      defaults={defaults.providerApproved}
                      onChange={(next) => updateKind("providerApproved", next)}
                    />
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

        <TabContent value={TOP_TABS.platformFee} className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comision platformă și payout</CardTitle>
              <CardDescription>
                Procentul reținut din plățile noi și suma minimă pe care prestatorul
                trebuie să o aibă disponibilă înainte de a solicita retragerea.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {appUpdateError && (
                <p className="text-sm text-rose-500">{appUpdateError}</p>
              )}
              {appUpdateLoading ? (
                <AdminFormGridSkeleton fields={2} />
              ) : (
                <div className="grid max-w-md gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Comision platformă (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={appUpdateState.platformFeePercent}
                      onChange={(event) =>
                        updateAppUpdateField(
                          "platformFeePercent",
                          Math.min(Math.max(Number(event.target.value || 0), 0), 100)
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Se aplică la plățile noi. Valorile existente în istoricul de plăți
                      rămân neschimbate.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Sumă minimă payout (RON)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100000"
                      step="0.01"
                      value={appUpdateState.minPayoutAmount}
                      onChange={(event) =>
                        updateAppUpdateField(
                          "minPayoutAmount",
                          Math.min(Math.max(Number(event.target.value || 0), 0), 100000)
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Prestatorul poate solicita plata doar când soldul disponibil (net)
                      atinge această sumă. 0 = fără minim.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {appUpdateSaveError && (
              <p className="text-sm text-rose-500">{appUpdateSaveError}</p>
            )}
            {appUpdateSaveOk && !appUpdateSaveError && (
              <p className="text-sm text-emerald-600">
                Setările de plată prestator au fost salvate.
              </p>
            )}
            <Button
              onClick={saveAppUpdateSettings}
              disabled={appUpdateSaving || appUpdateLoading}
            >
              {appUpdateSaving ? "Se salvează..." : "Salvează setările"}
            </Button>
          </div>
        </TabContent>

        <TabContent value={TOP_TABS.appUpdate} className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modal actualizare aplicație</CardTitle>
              <CardDescription>
                Controlează mesajul global afișat în aplicația Expo. Varianta
                forțată blochează închiderea modalului.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {appUpdateError && (
                <p className="text-sm text-rose-500">{appUpdateError}</p>
              )}
              {appUpdateLoading ? (
                <AdminFormGridSkeleton fields={8} />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={appUpdateState.enabled}
                        onChange={(event) =>
                          updateAppUpdateField("enabled", event.target.checked)
                        }
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          Activează modalul
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          Când este activ, aplicația mobilă verifică endpointul
                          public și afișează mesajul peste orice ecran.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={appUpdateState.paymentDemoModeEnabled}
                        onChange={(event) =>
                          updateAppUpdateField(
                            "paymentDemoModeEnabled",
                            event.target.checked
                          )
                        }
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          Activează plată demo (fără Stripe)
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          Checkout-ul mobil finalizează plata prin fluxul demo,
                          fără PaymentSheet Stripe.
                        </span>
                      </span>
                    </label>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mod afișare</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                        value={appUpdateState.mode}
                        onChange={(event) =>
                          updateAppUpdateField(
                            "mode",
                            event.target.value === "force" ? "force" : "notice"
                          )
                        }
                      >
                        <option value="notice">Înștiințare</option>
                        <option value="force">Forțare actualizare</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Versiune afișată
                      </label>
                      <Input
                        placeholder="Ex: 1.0.5"
                        value={appUpdateState.displayVersion}
                        onChange={(event) =>
                          updateAppUpdateField("displayVersion", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Versiune minimă iOS
                      </label>
                      <Input
                        placeholder="Ex: 1.0.2"
                        value={appUpdateState.minVersionIos}
                        onChange={(event) =>
                          updateAppUpdateField("minVersionIos", event.target.value)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Modalul apare doar dacă versiunea instalată e mai mică
                        decât aceasta.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Versiune minimă Android
                      </label>
                      <Input
                        placeholder="Ex: 1.0.2"
                        value={appUpdateState.minVersionAndroid}
                        onChange={(event) =>
                          updateAppUpdateField(
                            "minVersionAndroid",
                            event.target.value
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Modalul apare doar dacă versiunea instalată e mai mică
                        decât aceasta.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL iOS</label>
                      <Input
                        placeholder="https://apps.apple.com/..."
                        value={appUpdateState.urls.ios}
                        onChange={(event) =>
                          updateAppUpdateUrl("ios", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL Android</label>
                      <Input
                        placeholder="https://play.google.com/..."
                        value={appUpdateState.urls.android}
                        onChange={(event) =>
                          updateAppUpdateUrl("android", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL fallback</label>
                      <Input
                        placeholder="https://ainevoie.ro"
                        value={appUpdateState.urls.fallback}
                        onChange={(event) =>
                          updateAppUpdateUrl("fallback", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {(["ro", "en"] as AppUpdateLocale[]).map((locale) => (
                      <div key={locale} className="space-y-4 rounded-lg border border-border p-4">
                        <h3 className="text-sm font-semibold">
                          Texte {localeLabels[locale]}
                        </h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Titlu</label>
                          <Input
                            value={appUpdateState.title[locale]}
                            onChange={(event) =>
                              updateAppUpdateLocaleField(
                                "title",
                                locale,
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Mesaj</label>
                          <textarea
                            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={appUpdateState.body[locale]}
                            onChange={(event) =>
                              updateAppUpdateLocaleField(
                                "body",
                                locale,
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Label buton
                          </label>
                          <Input
                            value={appUpdateState.primaryActionLabel[locale]}
                            onChange={(event) =>
                              updateAppUpdateLocaleField(
                                "primaryActionLabel",
                                locale,
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {appUpdateSaveError && (
              <p className="text-sm text-rose-500">{appUpdateSaveError}</p>
            )}
            {appUpdateSaveOk && !appUpdateSaveError && (
              <p className="text-sm text-emerald-600">
                Setările de actualizare au fost salvate.
              </p>
            )}
            <Button
              onClick={saveAppUpdateSettings}
              disabled={appUpdateSaving || appUpdateLoading}
            >
              {appUpdateSaving ? "Se salvează..." : "Salvează actualizarea"}
            </Button>
          </div>
        </TabContent>
      </Tabs>
    </div>
  );
}

export const APP_UPDATE_SETTINGS_COLLECTION = "admin_settings";
export const APP_UPDATE_SETTINGS_DOC = "mobile_app_update";

export type AppUpdateMode = "notice" | "force";
export type AppUpdateLocale = "ro" | "en";

export type AppUpdateSettings = {
  enabled: boolean;
  mode: AppUpdateMode;
  revision: string;
  displayVersion: string;
  title: Record<AppUpdateLocale, string>;
  body: Record<AppUpdateLocale, string>;
  primaryActionLabel: Record<AppUpdateLocale, string>;
  urls: {
    ios: string;
    android: string;
    fallback: string;
  };
};

const DEFAULT_REVISION = "mobile-update-default";

export function getDefaultAppUpdateSettings(): AppUpdateSettings {
  return {
    enabled: false,
    mode: "notice",
    revision: DEFAULT_REVISION,
    displayVersion: "",
    title: {
      ro: "Actualizare disponibilă",
      en: "Update available",
    },
    body: {
      ro: "Am publicat o versiune nouă a aplicației AI Nevoie. Actualizează aplicația pentru cea mai bună experiență.",
      en: "A new version of the AI Nevoie app is available. Update the app for the best experience.",
    },
    primaryActionLabel: {
      ro: "Actualizează aplicația",
      en: "Update app",
    },
    urls: {
      ios: "",
      android: "",
      fallback: "",
    },
  };
}

function readString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readLocaleRecord(
  value: unknown,
  fallback: Record<AppUpdateLocale, string>,
  maxLength: number
): Record<AppUpdateLocale, string> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    ro: readString(source.ro, maxLength) || fallback.ro,
    en: readString(source.en, maxLength) || fallback.en,
  };
}

function sanitizeUrl(value: unknown) {
  const raw = readString(value, 500);
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function buildRevision(settings: AppUpdateSettings) {
  return [
    settings.enabled ? "enabled" : "disabled",
    settings.mode,
    settings.displayVersion,
    settings.title.ro,
    settings.title.en,
    settings.body.ro,
    settings.body.en,
    settings.primaryActionLabel.ro,
    settings.primaryActionLabel.en,
    settings.urls.ios,
    settings.urls.android,
    settings.urls.fallback,
  ].join("|");
}

export function sanitizeAppUpdateSettings(raw: unknown): AppUpdateSettings {
  const defaults = getDefaultAppUpdateSettings();
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const urlsSource = source.urls && typeof source.urls === "object"
    ? source.urls as Record<string, unknown>
    : {};

  const settings: AppUpdateSettings = {
    enabled: source.enabled === true,
    mode: source.mode === "force" ? "force" : "notice",
    revision: readString(source.revision, 120) || defaults.revision,
    displayVersion: readString(source.displayVersion, 80),
    title: readLocaleRecord(source.title, defaults.title, 120),
    body: readLocaleRecord(source.body, defaults.body, 900),
    primaryActionLabel: readLocaleRecord(
      source.primaryActionLabel,
      defaults.primaryActionLabel,
      80
    ),
    urls: {
      ios: sanitizeUrl(urlsSource.ios),
      android: sanitizeUrl(urlsSource.android),
      fallback: sanitizeUrl(urlsSource.fallback),
    },
  };

  return {
    ...settings,
    revision: settings.revision === defaults.revision ? buildRevision(settings) : settings.revision,
  };
}

export function validateAppUpdateSettings(settings: AppUpdateSettings) {
  if (!settings.enabled) {
    return null;
  }

  if (!settings.urls.ios && !settings.urls.android && !settings.urls.fallback) {
    return "Adaugă cel puțin un URL valid de actualizare înainte să activezi modalul.";
  }

  return null;
}

export function getPublicAppUpdateSettings(settings: AppUpdateSettings) {
  return {
    enabled: settings.enabled,
    mode: settings.mode,
    revision: settings.revision,
    displayVersion: settings.displayVersion,
    title: settings.title,
    body: settings.body,
    primaryActionLabel: settings.primaryActionLabel,
    urls: settings.urls,
  };
}

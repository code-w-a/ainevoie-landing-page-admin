const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  scheduled: "Programată",
  queued: "În coadă",
  sending: "În trimitere",
  sent: "Trimisă",
  sent_with_errors: "Trimisă cu erori",
  failed: "Eșuată",
  canceled: "Anulată",
  skipped: "Ignorată",
};

const SUBSCRIBER_STATUS_LABELS: Record<string, string> = {
  active: "Activ",
  unsubscribed: "Dezabonat",
  bounced: "Respins (bounce)",
  complaint: "Plângere",
  suppressed: "Suprimat",
};

const LOG_LEVEL_LABELS: Record<string, string> = {
  info: "Info",
  error: "Eroare",
  warning: "Avertisment",
};

/** Status document `jobs` sub campanie (trimitere per destinatar). */
const CAMPAIGN_JOB_STATUS_LABELS: Record<string, string> = {
  queued: "În coadă",
  sending: "În trimitere",
  sent: "Trimis",
  failed: "Eșuat",
  skipped: "Ignorat",
};

function normalizeLabelKey(value: string): string {
  return value.trim().toLowerCase();
}

export function campaignStatusLabel(status?: string | null): string {
  if (!status) {
    return "-";
  }
  const normalized = normalizeLabelKey(status);
  return CAMPAIGN_STATUS_LABELS[normalized] || status;
}

export function subscriberStatusLabel(status?: string | null): string {
  if (!status) {
    return "-";
  }
  const normalized = normalizeLabelKey(status);
  return SUBSCRIBER_STATUS_LABELS[normalized] || status;
}

export function logLevelLabel(level?: string | null): string {
  if (!level) {
    return "-";
  }
  const normalized = normalizeLabelKey(level);
  return LOG_LEVEL_LABELS[normalized] || level;
}

export function campaignJobStatusLabel(status?: string | null): string {
  if (!status) {
    return "-";
  }
  const normalized = normalizeLabelKey(status);
  return CAMPAIGN_JOB_STATUS_LABELS[normalized] || status;
}

export const adminCommonLabels = {
  search: "Căutare",
  page: "Pagina",
  previous: "Anterior",
  next: "Următor",
  allStatuses: "Toate statusurile",
  newest: "Cele mai noi",
  descending: "Descrescător",
  ascending: "Crescător",
  loadingData: "Se încarcă datele...",
  loadingOverview: "Se încarcă sumarul...",
  loadingCampaigns: "Se încarcă campaniile...",
  loadingSubscribers: "Se încarcă abonații...",
  loadingLogs: "Se încarcă logurile...",
  loadingSettings: "Se încarcă setările...",
  loadingProvider: "Se încarcă prestatorul...",
} as const;

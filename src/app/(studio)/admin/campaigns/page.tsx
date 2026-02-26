"use client";

import { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch } from "@/components/admin/adminApi";
import {
  campaignTemplateList,
  getCampaignTemplateDefinition,
  getDefaultTemplateData,
  normalizePublicBaseUrl,
  renderCampaignTemplate,
  validateCampaignTemplateInput,
  type CampaignTemplateId,
} from "@/lib/emailTemplates/campaignTemplates";
import {
  adminCommonLabels,
  campaignStatusLabel,
  logLevelLabel,
} from "@/lib/adminLabels";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SCHEDULE_TIMEZONE = "Europe/Bucharest";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: adminCommonLabels.allStatuses },
  { value: "draft", label: "Ciornă" },
  { value: "scheduled", label: "Programată" },
  { value: "queued", label: "În coadă" },
  { value: "sending", label: "În trimitere" },
  { value: "sent", label: "Trimisă" },
  { value: "sent_with_errors", label: "Trimisă cu erori" },
  { value: "canceled", label: "Anulată" },
] as const;

type NewsletterSettingsResponse = {
  item: {
    baseUrl?: string;
  } | null;
};

type CampaignReportResponse = {
  campaign: any;
  stats: {
    total?: number;
    queued?: number;
    sent?: number;
    failed?: number;
    skipped?: number;
    deliveryRate?: number;
    errorRate?: number;
  };
  jobsBreakdown: {
    queued: number;
    sending: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  failedJobs: any[];
  logs: any[];
};

type DateTimeLocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDateTimeLocal(value: string): DateTimeLocalParts | null {
  const trimmed = value.trim();
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function getTimeZoneParts(date: Date, timeZone: string): DateTimeLocalParts | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const readPart = (name: string) =>
      Number(parts.find((part) => part.type === name)?.value || "0");

    return {
      year: readPart("year"),
      month: readPart("month"),
      day: readPart("day"),
      hour: readPart("hour"),
      minute: readPart("minute"),
    };
  } catch {
    return null;
  }
}

function bucharestLocalToUtcIso(localValue: string): string | null {
  const target = parseDateTimeLocal(localValue);
  if (!target) {
    return null;
  }

  const targetAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    0,
    0
  );

  let utcMs = targetAsUtc;
  for (let index = 0; index < 4; index += 1) {
    const currentParts = getTimeZoneParts(new Date(utcMs), SCHEDULE_TIMEZONE);
    if (!currentParts) {
      return null;
    }

    const currentAsUtc = Date.UTC(
      currentParts.year,
      currentParts.month - 1,
      currentParts.day,
      currentParts.hour,
      currentParts.minute,
      0,
      0
    );

    const diff = targetAsUtc - currentAsUtc;
    if (diff === 0) {
      break;
    }
    utcMs += diff;
  }

  return new Date(utcMs).toISOString();
}

function utcIsoToBucharestInput(isoValue: unknown): string {
  if (typeof isoValue !== "string" || !isoValue.trim()) {
    return "";
  }
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const parts = getTimeZoneParts(parsed, SCHEDULE_TIMEZONE);
  if (!parts) {
    return "";
  }
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(
    parts.hour
  )}:${pad2(parts.minute)}`;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.clone().json();
    if (data && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // noop
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // noop
  }

  return fallback;
}

function normalizeCampaignStatus(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function campaignBadgeVariant(status: string): "success" | "warning" | "danger" | "outline" {
  if (status === "sent") {
    return "success";
  }
  if (["queued", "scheduled", "sending"].includes(status)) {
    return "warning";
  }
  if (["sent_with_errors", "failed", "canceled"].includes(status)) {
    return "danger";
  }
  return "outline";
}

export default function CampaignsPage() {
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [templateId, setTemplateId] = useState<CampaignTemplateId>("updates");
  const [templateData, setTemplateData] = useState<Record<string, string>>(
    () => getDefaultTemplateData("updates")
  );
  const [testEmail, setTestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowLoading, setRowLoading] = useState<Record<string, string>>({});
  const [scheduleById, setScheduleById] = useState<Record<string, string>>({});
  const [reportCampaignId, setReportCampaignId] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<CampaignReportResponse | null>(null);

  const cursor = cursors[pageIndex];
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    if (cursor) {
      params.set("cursor", cursor);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    return `/api/admin/newsletter/campaigns?${params.toString()}`;
  }, [cursor, pageSize, sortBy, sortDir, statusFilter]);

  const { data, loading, error, reload } = useAdminData<{
    items: any[];
    nextCursor: string | null;
  }>(endpoint);
  const {
    data: settingsData,
    loading: settingsLoading,
    error: settingsError,
  } = useAdminData<NewsletterSettingsResponse>("/api/admin/newsletter/settings");

  const campaigns = useMemo(() => data?.items ?? [], [data?.items]);
  const nextCursor = data?.nextCursor ?? null;
  const rawBaseUrl =
    typeof settingsData?.item?.baseUrl === "string" ? settingsData.item.baseUrl : "";
  const baseUrl = useMemo(() => normalizePublicBaseUrl(rawBaseUrl), [rawBaseUrl]);
  const selectedTemplate = getCampaignTemplateDefinition(templateId);
  const isLocalBaseUrl = useMemo(() => {
    if (!baseUrl) {
      return false;
    }

    try {
      const parsed = new URL(baseUrl);
      return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }, [baseUrl]);

  useEffect(() => {
    setTemplateData(getDefaultTemplateData(templateId));
    setCreateError(null);
    setCreateSuccess(null);
    setTestError(null);
    setTestSuccess(null);
  }, [templateId]);

  useEffect(() => {
    if (nextCursor && !cursors[pageIndex + 1]) {
      setCursors((prev) => {
        const next = [...prev];
        next[pageIndex + 1] = nextCursor;
        return next;
      });
    }
  }, [nextCursor, pageIndex, cursors]);

  useEffect(() => {
    setPageIndex(0);
    setCursors([null]);
  }, [pageSize, sortBy, sortDir, statusFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [pageIndex, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    setScheduleById((prev) => {
      const next = { ...prev };
      for (const campaign of campaigns) {
        const id = typeof campaign.id === "string" ? campaign.id : "";
        if (!id || next[id]) {
          continue;
        }
        const localDate = utcIsoToBucharestInput(campaign.scheduledAt);
        if (localDate) {
          next[id] = localDate;
        }
      }
      return next;
    });
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return campaigns;
    }
    return campaigns.filter((campaign) => {
      const name = (campaign.subject || campaign.name || "").toLowerCase();
      return name.includes(normalizedSearch);
    });
  }, [campaigns, search]);

  const pageIds = filteredCampaigns
    .map((campaign) => campaign.id)
    .filter(Boolean) as string[];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const templateValidation = useMemo(
    () =>
      validateCampaignTemplateInput({
        templateId,
        templateData,
      }),
    [templateData, templateId]
  );

  const previewHtml = useMemo(() => {
    if (!baseUrl) {
      return "";
    }

    try {
      return renderCampaignTemplate({
        templateId,
        templateData,
        baseUrl,
        subject: subject || "Previzualizare campanie",
      }).html;
    } catch {
      return "";
    }
  }, [baseUrl, subject, templateData, templateId]);

  function handleTemplateFieldChange(key: string, value: string) {
    setTemplateData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function setRowAction(id: string, action: string | null) {
    setRowLoading((prev) => {
      if (!action) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: action,
      };
    });
  }

  function isRowActionLoading(id: string, action?: string) {
    if (!rowLoading[id]) {
      return false;
    }
    return action ? rowLoading[id] === action : true;
  }

  async function handleCreate() {
    setCreateError(null);
    setCreateSuccess(null);

    if (!subject.trim()) {
      setCreateError("Subiectul este obligatoriu.");
      return;
    }
    if (!baseUrl) {
      setCreateError("Setează URL-ul public de bază în Setări newsletter.");
      return;
    }
    if (templateValidation.errors.length > 0) {
      setCreateError(templateValidation.errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminFetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          previewText: previewText.trim() || undefined,
          templateId,
          templateData: templateValidation.normalizedData,
        }),
      });

      if (!response.ok) {
        setCreateError(await readErrorMessage(response, "Nu am putut salva draftul."));
        return;
      }

      setCreateSuccess("Campania a fost salvată ca draft.");
      setSubject("");
      setPreviewText("");
      setTemplateData(getDefaultTemplateData(templateId));
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendTest() {
    setTestError(null);
    setTestSuccess(null);

    if (!testEmail.trim() || !testEmail.includes("@")) {
      setTestError("Introdu o adresă validă pentru test.");
      return;
    }
    if (!subject.trim()) {
      setTestError("Subiectul este obligatoriu pentru test.");
      return;
    }
    if (!baseUrl) {
      setTestError("Setează URL-ul public de bază în Setări newsletter.");
      return;
    }
    if (templateValidation.errors.length > 0) {
      setTestError(templateValidation.errors[0]);
      return;
    }

    setSendingTest(true);
    try {
      const response = await adminFetch("/api/admin/newsletter/campaigns/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: testEmail.trim().toLowerCase(),
          subject: subject.trim(),
          previewText: previewText.trim() || undefined,
          templateId,
          templateData: templateValidation.normalizedData,
        }),
      });

      if (!response.ok) {
        setTestError(
          await readErrorMessage(response, "Nu am putut trimite emailul de test.")
        );
        return;
      }

      setTestSuccess("Emailul de test a fost trimis.");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleUpdate() {
    if (!editId || !editSubject || !editHtml) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminFetch(`/api/admin/newsletter/campaigns/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, html: editHtml }),
      });

      if (!response.ok) {
        setCreateError(
          await readErrorMessage(response, "Nu am putut salva modificările.")
        );
        return;
      }

      setEditId(null);
      setEditSubject("");
      setEditHtml("");
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendNow(id: string) {
    if (!id) {
      return;
    }
    setCreateError(null);
    setCreateSuccess(null);
    setRowAction(id, "send");
    try {
      const response = await adminFetch(`/api/admin/newsletter/campaigns/${id}/send`, {
        method: "POST",
      });
      if (!response.ok) {
        setCreateError(
          await readErrorMessage(response, "Nu am putut porni trimiterea.")
        );
        return;
      }
      setCreateSuccess("Trimiterea campaniei a pornit.");
      reload();
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleSchedule(id: string) {
    if (!id) {
      return;
    }

    const localValue = scheduleById[id] || "";
    if (!localValue) {
      setCreateError("Selectează data și ora programării.");
      return;
    }

    const utcIso = bucharestLocalToUtcIso(localValue);
    if (!utcIso) {
      setCreateError("Data programării este invalidă.");
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);
    setRowAction(id, "schedule");
    try {
      const response = await adminFetch(
        `/api/admin/newsletter/campaigns/${id}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleAtIso: utcIso,
            scheduleTimezone: SCHEDULE_TIMEZONE,
          }),
        }
      );

      if (!response.ok) {
        setCreateError(await readErrorMessage(response, "Nu am putut programa campania."));
        return;
      }

      setCreateSuccess("Campania a fost programată.");
      reload();
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleUnschedule(id: string) {
    if (!id) {
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);
    setRowAction(id, "unschedule");
    try {
      const response = await adminFetch(
        `/api/admin/newsletter/campaigns/${id}/unschedule`,
        { method: "POST" }
      );

      if (!response.ok) {
        setCreateError(
          await readErrorMessage(response, "Nu am putut anula programarea.")
        );
        return;
      }

      setCreateSuccess("Programarea campaniei a fost anulată.");
      reload();
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleRequeue(id: string) {
    if (!id) {
      return;
    }
    setCreateError(null);
    setCreateSuccess(null);
    setRowAction(id, "requeue");
    try {
      const response = await adminFetch(`/api/admin/newsletter/campaigns/${id}/requeue`, {
        method: "POST",
      });
      if (!response.ok) {
        setCreateError(
          await readErrorMessage(response, "Nu am putut recoada joburile eșuate.")
        );
        return;
      }
      setCreateSuccess("Joburile eșuate au fost reintroduse în coadă.");
      reload();
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleBulkRequeue() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);
    const responses = await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/campaigns/${id}/requeue`, {
          method: "POST",
        })
      )
    );

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      setCreateError(
        await readErrorMessage(failed, "Nu am putut recoada toate campaniile selectate.")
      );
      return;
    }

    setCreateSuccess("Campaniile selectate au fost recoadate.");
    reload();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);
    const responses = await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/campaigns/${id}`, {
          method: "DELETE",
        })
      )
    );

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      setCreateError(
        await readErrorMessage(failed, "Nu am putut șterge toate campaniile selectate.")
      );
      return;
    }

    setSelectedIds(new Set());
    setCreateSuccess("Campaniile selectate au fost șterse.");
    reload();
  }

  async function handleViewReport(id: string) {
    if (!id) {
      return;
    }

    if (reportCampaignId === id && reportData) {
      setReportCampaignId(null);
      setReportData(null);
      setReportError(null);
      return;
    }

    setReportCampaignId(id);
    setReportLoading(true);
    setReportError(null);
    setReportData(null);

    try {
      const response = await adminFetch(`/api/admin/newsletter/campaigns/${id}/report`, {
        method: "GET",
      });

      if (!response.ok) {
        setReportError(
          await readErrorMessage(response, "Nu am putut încărca raportul campaniei.")
        );
        return;
      }

      const json = (await response.json()) as CampaignReportResponse;
      setReportData(json);
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campanii</h1>
          <p className="text-sm text-muted-foreground">
            Creează campanii din template-uri și trimite doar prin acțiuni explicite.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={submitting || settingsLoading || !baseUrl}
        >
          {submitting ? "Se salvează..." : "Salvează draft"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creează campanie</CardTitle>
          <CardDescription>
            Selectează un template, completează câmpurile și verifică preview-ul.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {settingsError && <p className="text-sm text-rose-500">{settingsError}</p>}
          {!baseUrl && !settingsLoading && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Setează câmpul <strong>URL public de bază</strong> în Setări pentru a
              activa creatorul de campanii.
            </p>
          )}
          {isLocalBaseUrl && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              URL-ul public de bază este local ({baseUrl}). Previzualizarea merge
              local, dar imaginile din email nu se vor încărca în inbox extern.
            </p>
          )}
          {createError && <p className="text-sm text-rose-500">{createError}</p>}
          {createSuccess && <p className="text-sm text-emerald-600">{createSuccess}</p>}

          <div className="grid gap-3 md:grid-cols-3">
            {campaignTemplateList.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setTemplateId(template.id)}
                className={`rounded-md border p-3 text-left transition ${
                  templateId === template.id ?
                    "border-primary bg-primary/5" :
                    "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{template.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {template.description}
                </p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subiect</label>
              <Input
                placeholder="Noutăți AInevoie"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Text previzualizare (opțional)</label>
              <Input
                placeholder="Rezumat scurt vizibil în inbox"
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {selectedTemplate.fields.map((field) => (
              <div
                key={field.key}
                className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
              >
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={field.rows || 4}
                    placeholder={field.placeholder}
                    value={templateData[field.key] || ""}
                    onChange={(event) =>
                      handleTemplateFieldChange(field.key, event.target.value)
                    }
                  />
                ) : field.type === "select" ? (
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={templateData[field.key] || ""}
                    onChange={(event) =>
                      handleTemplateFieldChange(field.key, event.target.value)
                    }
                  >
                    {(field.options || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === "url" ? "url" : "text"}
                    placeholder={field.placeholder}
                    value={templateData[field.key] || ""}
                    onChange={(event) =>
                      handleTemplateFieldChange(field.key, event.target.value)
                    }
                  />
                )}
                {field.helperText && (
                  <p className="text-xs text-muted-foreground">{field.helperText}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Previzualizare</label>
              {!baseUrl ? (
                <p className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Previzualizare indisponibilă până setezi URL-ul public de bază.
                </p>
              ) : templateValidation.errors.length > 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {templateValidation.errors[0]}
                </p>
              ) : (
                <iframe
                  title="Previzualizare campanie"
                  className="h-[420px] w-full rounded-md border border-border bg-white"
                  srcDoc={previewHtml}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trimite email test (opțional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="adresa@test.ro"
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sendingTest || submitting || settingsLoading || !baseUrl}
                >
                  {sendingTest ? "Se trimite..." : "Trimite test"}
                </Button>
              </div>
              {testError && <p className="text-sm text-rose-500">{testError}</p>}
              {testSuccess && <p className="text-sm text-emerald-600">{testSuccess}</p>}
              <p className="text-xs text-muted-foreground">
                Template selectat: <strong>{selectedTemplate.name}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editează campanie</CardTitle>
          <CardDescription>Actualizează subiectul și HTML-ul pentru campaniile existente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subiect</label>
            <Input
              placeholder="Selectează o campanie"
              value={editSubject}
              onChange={(event) => setEditSubject(event.target.value)}
              disabled={!editId}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">HTML</label>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="HTML pentru campanie"
              value={editHtml}
              onChange={(event) => setEditHtml(event.target.value)}
              disabled={!editId}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={!editId || submitting}>
              {submitting ? "Se salvează..." : "Salvează modificările"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditId(null);
                setEditSubject("");
                setEditHtml("");
              }}
            >
              Golește
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toate campaniile</CardTitle>
          <CardDescription>
            Flux recomandat: Ciornă → Test → Programează/Trimite acum → Raport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">{adminCommonLabels.loadingCampaigns}</p>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              className="max-w-xs"
              placeholder="Caută campanii"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="createdAt">{adminCommonLabels.newest}</option>
              <option value="subject">Subiect</option>
              <option value="sent">Trimise</option>
              <option value="failed">Eșuate</option>
              <option value="total">Total</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sortDir}
              onChange={(event) => setSortDir(event.target.value)}
            >
              <option value="desc">{adminCommonLabels.descending}</option>
              <option value="asc">{adminCommonLabels.ascending}</option>
            </select>
            <Button
              variant="outline"
              onClick={handleBulkRequeue}
              disabled={selectedIds.size === 0}
            >
              Recoadă selecția
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
            >
              Șterge selecția
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={allSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </TableHead>
                <TableHead>Subiect</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Destinatari</TableHead>
                <TableHead>Trimise</TableHead>
                <TableHead>Eșuate</TableHead>
                <TableHead>Programare</TableHead>
                <TableHead>Creată</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const id = campaign.id as string | undefined;
                const status = normalizeCampaignStatus(campaign.status);
                const scheduleValue = id ? scheduleById[id] || "" : "";
                const canSendNow = ["draft", "scheduled"].includes(status);
                const canSchedule = ["draft", "scheduled"].includes(status);
                const canUnschedule = status === "scheduled";

                return (
                  <TableRow key={id || campaign.name}>
                    <TableCell>
                      <Checkbox
                        checked={id ? selectedIds.has(id) : false}
                        onChange={(event) =>
                          id ? toggleRow(id, event.target.checked) : undefined
                        }
                        disabled={!id}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{campaign.subject || campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={campaignBadgeVariant(status)}>
                        {campaignStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.stats?.total ?? campaign.recipients ?? "-"}</TableCell>
                    <TableCell>{campaign.stats?.sent ?? campaign.sent ?? "-"}</TableCell>
                    <TableCell>{campaign.stats?.failed ?? campaign.failed ?? "-"}</TableCell>
                    <TableCell>
                      {campaign.scheduledAt ? utcIsoToBucharestInput(campaign.scheduledAt) : "-"}
                    </TableCell>
                    <TableCell>{campaign.createdAt ?? "-"}</TableCell>
                    <TableCell className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditId(id ?? null);
                            setEditSubject(campaign.subject || "");
                            setEditHtml(campaign.html || "");
                          }}
                          disabled={!id || isRowActionLoading(id || "")}
                        >
                          Editează
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => (id ? handleRequeue(id) : undefined)}
                          disabled={!id || isRowActionLoading(id || "")}
                        >
                          {id && isRowActionLoading(id, "requeue") ? "Se recoadă..." : "Recoadă eșuate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => (id ? handleViewReport(id) : undefined)}
                          disabled={!id || isRowActionLoading(id || "")}
                        >
                          {reportCampaignId === id ? "Ascunde raport" : "Vezi raport"}
                        </Button>
                        {canSendNow && (
                          <Button
                            size="sm"
                            onClick={() => (id ? handleSendNow(id) : undefined)}
                            disabled={!id || isRowActionLoading(id || "")}
                          >
                            {id && isRowActionLoading(id, "send") ? "Se trimite..." : "Trimite acum"}
                          </Button>
                        )}
                        {canUnschedule && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => (id ? handleUnschedule(id) : undefined)}
                            disabled={!id || isRowActionLoading(id || "")}
                          >
                            {id && isRowActionLoading(id, "unschedule") ? "Se anulează..." : "Anulează programarea"}
                          </Button>
                        )}
                      </div>

                      {canSchedule && id && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="datetime-local"
                            className="h-8 w-[210px]"
                            value={scheduleValue}
                            onChange={(event) =>
                              setScheduleById((prev) => ({
                                ...prev,
                                [id]: event.target.value,
                              }))
                            }
                            disabled={isRowActionLoading(id)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSchedule(id)}
                            disabled={isRowActionLoading(id)}
                          >
                            {isRowActionLoading(id, "schedule") ? "Se programează..." : "Programează"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {adminCommonLabels.page} {pageIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={pageIndex <= 0}
                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              >
                {adminCommonLabels.previous}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!nextCursor}
                onClick={() => setPageIndex((prev) => prev + 1)}
              >
                {adminCommonLabels.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle>Raport campanie</CardTitle>
            <CardDescription>
              Campanie: <span className="font-medium">{reportCampaignId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportLoading && <p className="text-sm text-muted-foreground">Se încarcă raportul...</p>}
            {reportError && <p className="text-sm text-rose-500">{reportError}</p>}

            {reportData && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{reportData.stats.total ?? 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Trimise</p>
                    <p className="text-lg font-semibold">{reportData.stats.sent ?? 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Eșuate</p>
                    <p className="text-lg font-semibold">{reportData.stats.failed ?? 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Ignorate</p>
                    <p className="text-lg font-semibold">{reportData.stats.skipped ?? 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Rată livrare</p>
                    <p className="text-lg font-semibold">{reportData.stats.deliveryRate ?? 0}%</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Joburi eșuate</p>
                    {reportData.failedJobs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nu există joburi eșuate.</p>
                    ) : (
                      <div className="space-y-2">
                        {reportData.failedJobs.map((job) => (
                          <div key={job.id || `${job.email}-${job.lastError}`} className="rounded-md border p-3 text-xs">
                            <p><strong>Email:</strong> {job.email || "-"}</p>
                            <p><strong>Motiv:</strong> {job.lastError || "-"}</p>
                            <p><strong>Cod:</strong> {job.errorCode || "-"}</p>
                            <p><strong>Tip:</strong> {job.errorKind || "-"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ultimele loguri</p>
                    {reportData.logs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nu există loguri pentru această campanie.</p>
                    ) : (
                      <div className="space-y-2">
                        {reportData.logs.map((log, index) => (
                          <div key={`${log.id || index}-${log.message || ""}`} className="rounded-md border p-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{log.createdAt || "-"}</span>
                              <Badge variant={log.level === "error" ? "danger" : "secondary"}>
                                {logLevelLabel(log.level)}
                              </Badge>
                            </div>
                            <p className="mt-1">{log.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md border p-3 text-xs text-muted-foreground">
                  <p>
                    <strong>Breakdown joburi:</strong> queued={reportData.jobsBreakdown.queued},
                    sending={reportData.jobsBreakdown.sending}, sent={reportData.jobsBreakdown.sent},
                    failed={reportData.jobsBreakdown.failed}, skipped={reportData.jobsBreakdown.skipped}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

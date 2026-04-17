"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { TabContent, TabList, Tabs, TabTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  AdminFormGridSkeleton,
  AdminKpiRowSkeleton,
  AdminTableSkeleton,
} from "@/components/admin/AdminSkeletonLayouts";
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
  campaignJobStatusLabel,
  campaignStatusLabel,
  logLevelLabel,
} from "@/lib/adminLabels";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { adminToastWarning } from "@/lib/adminToast";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SCHEDULE_TIMEZONE = "Europe/Bucharest";
const ONE_HOUR_MS = 60 * 60 * 1000;
const MIN_SCHEDULE_DELAY_MS = 60 * 1000;
const MIN_SCHEDULE_DELAY_ERROR =
  "Programarea trebuie să fie cu cel puțin 60s în viitor.";

const REPORT_JOBS_PAGE_SIZE = 5;
const REPORT_JOBS_FETCH_CHUNK = 200;
const REPORT_JOBS_MAX_FETCH = 10000;

type CampaignTabValue = "create" | "list";
type CreateActionType = "draft" | "send_now" | "schedule";

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

type CampaignJobsPageResponse = {
  items: Record<string, unknown>[];
  nextCursor: string | null;
};

type ReportJobsStatusFilter =
  | "all"
  | "failed"
  | "with_errors"
  | "sent"
  | "skipped"
  | "queued"
  | "sending";

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

function getDefaultScheduleInput(): string {
  return utcIsoToBucharestInput(new Date(Date.now() + ONE_HOUR_MS).toISOString());
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

function campaignJobBadgeVariant(
  status: string
): "success" | "warning" | "danger" | "outline" {
  if (status === "sent") {
    return "success";
  }
  if (status === "failed") {
    return "danger";
  }
  if (status === "skipped") {
    return "warning";
  }
  if (status === "sending" || status === "queued") {
    return "outline";
  }
  return "outline";
}

function jobTimestampForSort(job: Record<string, unknown>): number {
  const raw = job.updatedAt ?? job.sentAt ?? job.createdAt ?? "";
  if (typeof raw !== "string" || !raw.trim()) {
    return 0;
  }
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatCampaignJobMotif(job: Record<string, unknown>): string {
  const last =
    typeof job.lastError === "string" && job.lastError.trim() ? job.lastError.trim() : "";
  const code =
    typeof job.errorCode === "string" && job.errorCode.trim() ? job.errorCode.trim() : "";
  const kind =
    typeof job.errorKind === "string" && job.errorKind.trim() ? job.errorKind.trim() : "";
  if (last && code) {
    return `${last} (${code})`;
  }
  if (last) {
    return last;
  }
  if (code && kind) {
    return `${code} (${kind})`;
  }
  if (code) {
    return code;
  }
  return "—";
}

function isScheduleTooSoon(utcIso: string): boolean {
  const scheduleDate = new Date(utcIso);
  if (Number.isNaN(scheduleDate.getTime())) {
    return false;
  }
  return scheduleDate.getTime() - Date.now() < MIN_SCHEDULE_DELAY_MS;
}

function isMinScheduleDelayMessage(message: string): boolean {
  return message.toLowerCase().includes("cel puțin 60s în viitor");
}

export default function CampaignsPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [templateId, setTemplateId] = useState<CampaignTemplateId>("updates");
  const [templateData, setTemplateData] = useState<Record<string, string>>(
    () => getDefaultTemplateData("updates")
  );
  const [testEmail, setTestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<CampaignTabValue>("list");
  const [createActionDialogOpen, setCreateActionDialogOpen] = useState(false);
  const [scheduleActionDialogOpen, setScheduleActionDialogOpen] = useState(false);
  const [createScheduleAtLocal, setCreateScheduleAtLocal] = useState(() =>
    getDefaultScheduleInput()
  );

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
  const [scheduleRowDialogId, setScheduleRowDialogId] = useState<string | null>(
    null
  );
  const [scheduleRowDialogAtLocal, setScheduleRowDialogAtLocal] = useState("");
  const [unscheduleTargetId, setUnscheduleTargetId] = useState<string | null>(
    null
  );
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deleteRowTargetId, setDeleteRowTargetId] = useState<string | null>(null);
  const [reportCampaignId, setReportCampaignId] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<CampaignReportResponse | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportJobsAll, setReportJobsAll] = useState<Record<string, unknown>[]>([]);
  const [reportJobsLoading, setReportJobsLoading] = useState(false);
  const [reportJobsError, setReportJobsError] = useState<string | null>(null);
  const [reportJobsSearch, setReportJobsSearch] = useState("");
  const [reportJobsStatusFilter, setReportJobsStatusFilter] =
    useState<ReportJobsStatusFilter>("all");
  const [reportJobsSortField, setReportJobsSortField] = useState<"email" | "status" | "updatedAt">(
    "email"
  );
  const [reportJobsSortDir, setReportJobsSortDir] = useState<"asc" | "desc">("asc");
  const [reportJobsPageIndex, setReportJobsPageIndex] = useState(0);

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
  const scheduleRowDialogLabel = useMemo(() => {
    if (!scheduleRowDialogId) {
      return "";
    }
    const row = campaigns.find(
      (c) => typeof c.id === "string" && c.id === scheduleRowDialogId
    );
    if (!row) {
      return "Campanie";
    }
    return String(row.subject || row.name || "Campanie");
  }, [scheduleRowDialogId, campaigns]);

  const unscheduleTargetLabel = useMemo(() => {
    if (!unscheduleTargetId) {
      return "";
    }
    const row = campaigns.find(
      (c) => typeof c.id === "string" && c.id === unscheduleTargetId
    );
    if (!row) {
      return "Campanie";
    }
    return String(row.subject || row.name || "Campanie");
  }, [unscheduleTargetId, campaigns]);

  const deleteRowTargetLabel = useMemo(() => {
    if (!deleteRowTargetId) {
      return "";
    }
    const row = campaigns.find(
      (c) => typeof c.id === "string" && c.id === deleteRowTargetId
    );
    if (!row) {
      return "Campanie";
    }
    return String(row.subject || row.name || "Campanie");
  }, [deleteRowTargetId, campaigns]);

  const reportJobsFilteredSorted = useMemo(() => {
    let list = [...reportJobsAll];
    const q = reportJobsSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((job) => {
        const email = typeof job.email === "string" ? job.email.toLowerCase() : "";
        return email.includes(q);
      });
    }
    if (reportJobsStatusFilter !== "all") {
      list = list.filter((job) => {
        const status =
          typeof job.status === "string" ? job.status.trim().toLowerCase() : "";
        if (reportJobsStatusFilter === "with_errors") {
          if (status === "failed") {
            return true;
          }
          const err = typeof job.lastError === "string" ? job.lastError.trim() : "";
          return Boolean(err);
        }
        return status === reportJobsStatusFilter;
      });
    }
    const dir = reportJobsSortDir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      if (reportJobsSortField === "email") {
        return String(a.email || "").localeCompare(String(b.email || ""), "ro", {
          sensitivity: "base",
        }) * dir;
      }
      if (reportJobsSortField === "status") {
        return (
          String(a.status || "").localeCompare(String(b.status || ""), "ro", {
            sensitivity: "base",
          }) * dir
        );
      }
      return (jobTimestampForSort(a) - jobTimestampForSort(b)) * dir;
    });
    return list;
  }, [
    reportJobsAll,
    reportJobsSearch,
    reportJobsStatusFilter,
    reportJobsSortField,
    reportJobsSortDir,
  ]);

  const reportJobsProcessedCount = reportJobsFilteredSorted.length;
  const reportJobsTotalPages =
    reportJobsProcessedCount === 0 ?
      0
    : Math.ceil(reportJobsProcessedCount / REPORT_JOBS_PAGE_SIZE);

  const reportJobsPageItems = useMemo(() => {
    if (reportJobsTotalPages === 0) {
      return [];
    }
    const safePage = Math.min(
      reportJobsPageIndex,
      Math.max(0, reportJobsTotalPages - 1)
    );
    const start = safePage * REPORT_JOBS_PAGE_SIZE;
    return reportJobsFilteredSorted.slice(start, start + REPORT_JOBS_PAGE_SIZE);
  }, [reportJobsFilteredSorted, reportJobsPageIndex, reportJobsTotalPages]);

  useEffect(() => {
    if (reportJobsTotalPages <= 0) {
      setReportJobsPageIndex(0);
      return;
    }
    setReportJobsPageIndex((prev) => Math.min(prev, reportJobsTotalPages - 1));
  }, [reportJobsTotalPages]);

  const nextCursor = data?.nextCursor ?? null;
  const rawBaseUrl =
    typeof settingsData?.item?.baseUrl === "string" ? settingsData.item.baseUrl : "";
  const baseUrl = useMemo(() => normalizePublicBaseUrl(rawBaseUrl), [rawBaseUrl]);
  const selectedTemplate = getCampaignTemplateDefinition(templateId);
  const templateScrollRef = useRef<HTMLDivElement>(null);
  const [templateScrollEdges, setTemplateScrollEdges] = useState({
    atStart: true,
    atEnd: true,
  });

  const updateTemplateScrollEdges = useCallback(() => {
    const el = templateScrollRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setTemplateScrollEdges({
      atStart: scrollLeft <= 1,
      atEnd: scrollLeft >= maxScroll - 1,
    });
  }, []);

  const scrollTemplateStrip = useCallback((direction: -1 | 1) => {
    const el = templateScrollRef.current;
    if (!el) {
      return;
    }
    const step = Math.max(240, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

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
  }, [templateId]);

  useEffect(() => {
    if (activeTab !== "create") {
      return;
    }
    updateTemplateScrollEdges();
    const el = templateScrollRef.current;
    if (!el) {
      return;
    }
    el.addEventListener("scroll", updateTemplateScrollEdges, { passive: true });
    const ro = new ResizeObserver(updateTemplateScrollEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateTemplateScrollEdges);
      ro.disconnect();
    };
  }, [activeTab, updateTemplateScrollEdges]);

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

  const reportCampaignLabel = useMemo(() => {
    const campaign = reportData?.campaign;
    const subject =
      typeof campaign?.subject === "string" ? campaign.subject.trim() : "";
    if (subject) {
      return subject;
    }

    const name = typeof campaign?.name === "string" ? campaign.name.trim() : "";
    if (name) {
      return name;
    }

    return reportCampaignId || "-";
  }, [reportCampaignId, reportData]);

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

  function getActionErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return fallback;
  }

  function validateCreateForm(): boolean {
    if (!subject.trim()) {
      toast.error("Subiectul este obligatoriu.");
      return false;
    }
    if (!baseUrl) {
      toast.error("Setează URL-ul public de bază în Setări newsletter.");
      return false;
    }
    if (templateValidation.errors.length > 0) {
      toast.error(templateValidation.errors[0]);
      return false;
    }

    return true;
  }

  function resetCreateForm() {
    setSubject("");
    setPreviewText("");
    setTemplateData(getDefaultTemplateData(templateId));
    setCreateScheduleAtLocal(getDefaultScheduleInput());
  }

  function closeCreateDialogs() {
    setCreateActionDialogOpen(false);
    setScheduleActionDialogOpen(false);
  }

  async function createDraftCampaign(): Promise<string> {
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
      throw new Error(await readErrorMessage(response, "Nu am putut salva draftul."));
    }

    const data = (await response.json()) as { campaignId?: string };
    const campaignId =
      typeof data?.campaignId === "string" ? data.campaignId.trim() : "";

    if (!campaignId) {
      throw new Error("Campania a fost salvată, dar lipsește ID-ul campaniei.");
    }

    return campaignId;
  }

  async function sendCampaignNow(campaignId: string) {
    const response = await adminFetch(`/api/admin/newsletter/campaigns/${campaignId}/send`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Nu am putut porni trimiterea."));
    }
  }

  async function scheduleCampaign(campaignId: string, scheduleAtIso: string) {
    const response = await adminFetch(
      `/api/admin/newsletter/campaigns/${campaignId}/schedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleAtIso,
          scheduleTimezone: SCHEDULE_TIMEZONE,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Nu am putut programa campania."));
    }
  }

  async function deleteCampaign(campaignId: string): Promise<boolean> {
    const response = await adminFetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
      method: "DELETE",
    });
    return response.ok;
  }

  async function executeCreateAction(
    action: CreateActionType,
    scheduleLocalValue?: string
  ) {
    if (!validateCreateForm()) {
      return;
    }

    let scheduleUtcIso: string | null = null;
    if (action === "schedule") {
      const localValue = (scheduleLocalValue || "").trim();
      if (!localValue) {
        toast.error("Selectează data și ora programării.");
        return;
      }
      const parsedUtc = bucharestLocalToUtcIso(localValue);
      if (!parsedUtc) {
        toast.error("Data programării este invalidă.");
        return;
      }
      if (isScheduleTooSoon(parsedUtc)) {
        adminToastWarning(MIN_SCHEDULE_DELAY_ERROR);
        return;
      }
      scheduleUtcIso = parsedUtc;
    }

    setSubmitting(true);
    try {
      const campaignId = await createDraftCampaign();
      let shouldFinalize = true;

      if (action === "draft") {
        toast.success("Campania a fost salvată ca draft.");
      } else if (action === "send_now") {
        try {
          await sendCampaignNow(campaignId);
          toast.success("Campania a fost creată și trimiterea a pornit.");
        } catch (error) {
          toast.error(
            `Campania a fost salvată ca draft, dar acțiunea ulterioară a eșuat: ${getActionErrorMessage(
              error,
              "Nu am putut porni trimiterea."
            )}`
          );
        }
      } else if (action === "schedule" && scheduleUtcIso) {
        if (isScheduleTooSoon(scheduleUtcIso)) {
          const deleted = await deleteCampaign(campaignId).catch(() => false);
          adminToastWarning(
            deleted ?
              MIN_SCHEDULE_DELAY_ERROR :
              `${MIN_SCHEDULE_DELAY_ERROR} Draftul nu a putut fi șters automat.`
          );
          shouldFinalize = false;
        } else {
          try {
            await scheduleCampaign(campaignId, scheduleUtcIso);
            toast.success("Campania a fost creată și programată.");
          } catch (error) {
            const scheduleError = getActionErrorMessage(
              error,
              "Nu am putut programa campania."
            );

            if (isMinScheduleDelayMessage(scheduleError)) {
              const deleted = await deleteCampaign(campaignId).catch(() => false);
              adminToastWarning(
                deleted ?
                  scheduleError :
                  `${scheduleError} Draftul nu a putut fi șters automat.`
              );
              shouldFinalize = false;
            } else {
              toast.error(
                `Campania a fost salvată ca draft, dar acțiunea ulterioară a eșuat: ${scheduleError}`
              );
            }
          }
        }
      }

      if (shouldFinalize) {
        closeCreateDialogs();
        resetCreateForm();
        setActiveTab("list");
        reload();
      }
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Nu am putut salva draftul."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenCreateActions() {
    if (!validateCreateForm()) {
      return;
    }

    setCreateActionDialogOpen(true);
    setScheduleActionDialogOpen(false);
    setCreateScheduleAtLocal(getDefaultScheduleInput());
  }

  function handleChooseScheduleAction() {
    setCreateActionDialogOpen(false);
    setScheduleActionDialogOpen(true);
    setCreateScheduleAtLocal((currentValue) => currentValue || getDefaultScheduleInput());
  }

  function handleCancelCreateDialogs() {
    if (submitting) {
      return;
    }
    closeCreateDialogs();
  }

  function handleBackToActionDialog() {
    if (submitting) {
      return;
    }
    setScheduleActionDialogOpen(false);
    setCreateActionDialogOpen(true);
  }

  async function handleSendTest() {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      toast.error("Introdu o adresă validă pentru test.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subiectul este obligatoriu pentru test.");
      return;
    }
    if (!baseUrl) {
      toast.error("Setează URL-ul public de bază în Setări newsletter.");
      return;
    }
    if (templateValidation.errors.length > 0) {
      toast.error(templateValidation.errors[0]);
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
        toast.error(
          await readErrorMessage(response, "Nu am putut trimite emailul de test.")
        );
        return;
      }

      toast.success("Emailul de test a fost trimis.");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendNow(id: string) {
    if (!id) {
      return;
    }
    setRowAction(id, "send");
    try {
      await sendCampaignNow(id);
      toast.success("Trimiterea campaniei a pornit.");
      reload();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Nu am putut porni trimiterea."));
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleSchedule(id: string, localValueOverride?: string) {
    if (!id) {
      return;
    }

    const localValue =
      localValueOverride !== undefined ? localValueOverride : scheduleById[id] || "";
    if (!localValue) {
      toast.error("Selectează data și ora programării.");
      return;
    }

    const utcIso = bucharestLocalToUtcIso(localValue);
    if (!utcIso) {
      toast.error("Data programării este invalidă.");
      return;
    }
    if (isScheduleTooSoon(utcIso)) {
      adminToastWarning(MIN_SCHEDULE_DELAY_ERROR);
      return;
    }

    setRowAction(id, "schedule");
    try {
      await scheduleCampaign(id, utcIso);
      toast.success("Campania a fost programată.");
      setScheduleById((prev) => ({ ...prev, [id]: localValue }));
      setScheduleRowDialogId((open) => (open === id ? null : open));
      reload();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Nu am putut programa campania."));
    } finally {
      setRowAction(id, null);
    }
  }

  function openScheduleRowDialog(id: string) {
    setScheduleRowDialogId(id);
    setScheduleRowDialogAtLocal(scheduleById[id] || getDefaultScheduleInput());
  }

  function closeScheduleRowDialog() {
    setScheduleRowDialogId(null);
  }

  async function handleUnschedule(id: string): Promise<boolean> {
    if (!id) {
      return false;
    }

    setRowAction(id, "unschedule");
    try {
      const response = await adminFetch(
        `/api/admin/newsletter/campaigns/${id}/unschedule`,
        { method: "POST" }
      );

      if (!response.ok) {
        toast.error(await readErrorMessage(response, "Nu am putut anula programarea."));
        return false;
      }

      toast.success("Programarea campaniei a fost anulată.");
      reload();
      return true;
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleDuplicateCampaign(id: string) {
    if (!id) {
      return;
    }
    setRowAction(id, "duplicate");
    try {
      const response = await adminFetch(`/api/admin/newsletter/campaigns/${id}/duplicate`, {
        method: "POST",
      });
      if (!response.ok) {
        toast.error(await readErrorMessage(response, "Nu am putut duplica campania."));
        return;
      }
      const data = (await response.json()) as { campaignId?: string | null };
      const newId = typeof data?.campaignId === "string" ? data.campaignId.trim() : "";
      if (!newId) {
        toast.error("Copie creată, dar lipsește ID-ul noii campanii.");
        return;
      }
      toast.success("Campania a fost copiată ca draft.");
      reload();
      router.push(`/admin/campaigns/${newId}`);
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleRequeue(id: string) {
    if (!id) {
      return;
    }
    setRowAction(id, "requeue");
    try {
      const response = await adminFetch(`/api/admin/newsletter/campaigns/${id}/requeue`, {
        method: "POST",
      });
      if (!response.ok) {
        toast.error(
          await readErrorMessage(response, "Nu am putut repune în coadă trimiterile eșuate.")
        );
        return;
      }

      let requeued = 0;
      try {
        const data = (await response.json()) as { result?: { requeued?: number }; requeued?: number };
        requeued =
          typeof data?.result?.requeued === "number" ?
            data.result.requeued
          : typeof data?.requeued === "number" ?
            data.requeued
          : 0;
      } catch {
        requeued = 0;
      }

      if (requeued > 0) {
        toast.success(
          requeued === 1 ?
            "O trimitere eșuată a fost repusă în coadă."
          : `${requeued} trimiteri eșuate au fost repuse în coadă.`
        );
      } else {
        toast.success("Nu existau trimiteri eșuate de repus în coadă.");
      }
      reload();
    } finally {
      setRowAction(id, null);
    }
  }

  async function handleBulkDelete(): Promise<boolean> {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return false;
    }

    const responses = await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/campaigns/${id}`, {
          method: "DELETE",
        })
      )
    );

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      toast.error(
        await readErrorMessage(failed, "Nu am putut șterge toate campaniile selectate.")
      );
      return false;
    }

    setSelectedIds(new Set());
    toast.success("Campaniile selectate au fost șterse.");
    reload();
    return true;
  }

  async function handleDeleteRowConfirmed(): Promise<boolean> {
    const targetId = deleteRowTargetId;
    if (!targetId) {
      return false;
    }

    const response = await adminFetch(`/api/admin/newsletter/campaigns/${targetId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Nu am putut șterge campania."));
      return false;
    }

    toast.success("Campania a fost ștearsă.");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    reload();
    return true;
  }

  async function handleViewReport(id: string) {
    if (!id) {
      return;
    }

    setReportDialogOpen(true);
    setReportCampaignId(id);
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    setReportJobsAll([]);
    setReportJobsError(null);
    setReportJobsLoading(true);
    setReportJobsPageIndex(0);
    setReportJobsSearch("");
    setReportJobsStatusFilter("all");
    setReportJobsSortField("email");
    setReportJobsSortDir("asc");

    try {
      const reportResponse = await adminFetch(`/api/admin/newsletter/campaigns/${id}/report`, {
        method: "GET",
      });

      if (!reportResponse.ok) {
        setReportError(
          await readErrorMessage(reportResponse, "Nu am putut încărca raportul campaniei.")
        );
        setReportJobsAll([]);
        return;
      }

      const json = (await reportResponse.json()) as CampaignReportResponse;
      setReportData(json);
      setReportLoading(false);

      const collected: Record<string, unknown>[] = [];
      let cursor: string | null = null;
      let hitCap = false;

      for (let step = 0; step < 500; step += 1) {
        const params = new URLSearchParams({
          limit: String(REPORT_JOBS_FETCH_CHUNK),
        });
        if (cursor) {
          params.set("cursor", cursor);
        }
        const jobsResponse = await adminFetch(
          `/api/admin/newsletter/campaigns/${id}/jobs?${params.toString()}`,
          { method: "GET" }
        );
        if (!jobsResponse.ok) {
          setReportJobsError(
            await readErrorMessage(jobsResponse, "Nu am putut încărca lista de destinatari.")
          );
          setReportJobsAll([]);
          return;
        }
        const jobsJson = (await jobsResponse.json()) as CampaignJobsPageResponse;
        const batch = Array.isArray(jobsJson.items) ? jobsJson.items : [];
        for (const row of batch) {
          collected.push(row);
          if (collected.length >= REPORT_JOBS_MAX_FETCH) {
            hitCap = true;
            break;
          }
        }
        if (hitCap) {
          break;
        }
        const next = typeof jobsJson.nextCursor === "string" ? jobsJson.nextCursor : null;
        if (!next) {
          break;
        }
        cursor = next;
      }

      setReportJobsAll(collected);
      setReportJobsError(null);
      if (hitCap) {
        adminToastWarning(
          `În tabel sunt încărcate primele ${REPORT_JOBS_MAX_FETCH} de destinatari. Folosește filtrele pentru a restrânge lista.`
        );
      }
    } finally {
      setReportLoading(false);
      setReportJobsLoading(false);
    }
  }

  function closeReportDialog() {
    setReportDialogOpen(false);
    setReportCampaignId(null);
    setReportData(null);
    setReportError(null);
    setReportJobsAll([]);
    setReportJobsError(null);
    setReportJobsLoading(false);
    setReportJobsSearch("");
    setReportJobsStatusFilter("all");
    setReportJobsSortField("email");
    setReportJobsSortDir("asc");
    setReportJobsPageIndex(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Campanii</h1>
        <p className="text-sm text-muted-foreground">
          Creează campanii din template-uri și trimite doar prin acțiuni explicite.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value === "list" ? "list" : "create")}
        className="space-y-4"
      >
        <TabList className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
          <TabTrigger
            value="create"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition data-[active=true]:bg-background data-[active=true]:text-foreground"
          >
            Creează campanie
          </TabTrigger>
          <TabTrigger
            value="list"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition data-[active=true]:bg-background data-[active=true]:text-foreground"
          >
            Toate campaniile
          </TabTrigger>
        </TabList>

        <TabContent value="create" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Creează campanie</CardTitle>
                <CardDescription>
                  Selectează un template, completează câmpurile și verifică preview-ul.
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenCreateActions}
                disabled={submitting || settingsLoading || !baseUrl}
              >
                {submitting ? "Se procesează..." : "Salvează"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {settingsError && <p className="text-sm text-rose-500">{settingsError}</p>}
              {settingsLoading ? (
                <div className="space-y-5">
                  <div className="flex items-stretch gap-2">
                    <Skeleton className="h-9 w-9 shrink-0 self-center rounded-md" />
                    <div className="flex min-h-[5.5rem] flex-1 gap-3 overflow-hidden">
                      <Skeleton className="h-24 min-w-[200px] shrink-0 rounded-md" />
                      <Skeleton className="h-24 min-w-[200px] shrink-0 rounded-md" />
                      <Skeleton className="h-24 min-w-[200px] shrink-0 rounded-md" />
                    </div>
                    <Skeleton className="h-9 w-9 shrink-0 self-center rounded-md" />
                  </div>
                  <AdminFormGridSkeleton fields={8} />
                  <Skeleton className="h-[min(420px,60vh)] w-full rounded-md" />
                </div>
              ) : (
                <>
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

              <div className="flex items-stretch gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-center"
                  aria-label="Derulează template-uri la stânga"
                  disabled={templateScrollEdges.atStart}
                  onClick={() => scrollTemplateStrip(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div
                  ref={templateScrollRef}
                  className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-smooth gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {campaignTemplateList.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTemplateId(template.id)}
                      className={`w-[min(260px,85vw)] shrink-0 snap-start rounded-md border p-3 text-left transition ${
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-center"
                  aria-label="Derulează template-uri la dreapta"
                  disabled={templateScrollEdges.atEnd}
                  onClick={() => scrollTemplateStrip(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
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

              <div className="flex flex-col gap-6">
                <div className="w-full space-y-2">
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
                      className="h-[min(520px,70vh)] w-full rounded-md border border-border bg-white"
                      srcDoc={previewHtml}
                    />
                  )}
                </div>
                <div className="w-full space-y-2 border-t border-border pt-6">
                  <label className="text-sm font-medium">Trimite email test (opțional)</label>
                  <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      className="sm:min-w-0 sm:flex-1"
                      placeholder="adresa@test.ro"
                      value={testEmail}
                      onChange={(event) => setTestEmail(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 sm:w-auto"
                      onClick={handleSendTest}
                      disabled={sendingTest || submitting || settingsLoading || !baseUrl}
                    >
                      {sendingTest ? "Se trimite..." : "Trimite test"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Template selectat: <strong>{selectedTemplate.name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  După completare, apasă Salvează și alege acțiunea dorită.
                </p>
                <Button
                  onClick={handleOpenCreateActions}
                  disabled={submitting || settingsLoading || !baseUrl}
                >
                  {submitting ? "Se procesează..." : "Salvează"}
                </Button>
              </div>
                </>
              )}
            </CardContent>
          </Card>

        </TabContent>

        <TabContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Toate campaniile</CardTitle>
              <CardDescription>
                Flux recomandat: Ciornă → Test → Programează/Trimite acum → Raport.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Input
                  className="max-w-xs"
                  placeholder="Caută campanii"
                  value={search}
                  disabled={loading}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                  value={statusFilter}
                  disabled={loading}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                  value={sortBy}
                  disabled={loading}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="createdAt">{adminCommonLabels.newest}</option>
                  <option value="subject">Subiect</option>
                  <option value="sent">Trimise</option>
                  <option value="failed">Eșuate</option>
                  <option value="total">Total</option>
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                  value={sortDir}
                  disabled={loading}
                  onChange={(event) => setSortDir(event.target.value)}
                >
                  <option value="desc">{adminCommonLabels.descending}</option>
                  <option value="asc">{adminCommonLabels.ascending}</option>
                </select>
                <Button
                  variant="destructive"
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  disabled={loading || selectedIds.size === 0}
                >
                  Șterge selecția
                </Button>
              </div>

              {loading ?
                <AdminTableSkeleton rows={10} columns={9} />
              : <Table>
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
                    const canSendNow = ["draft", "scheduled"].includes(status);
                    const canSchedule = ["draft", "scheduled"].includes(status);
                    const canUnschedule = status === "scheduled";
                    const failedCount = Number(campaign.stats?.failed ?? campaign.failed ?? 0);
                    const canRetryFailed = failedCount > 0;

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
                          {campaign.scheduledAt ?
                            formatAdminDateTime(campaign.scheduledAt)
                          : "-"}
                        </TableCell>
                        <TableCell>
                          {formatAdminDateTime(campaign.createdAt)}
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={!id}
                                aria-label="Acțiuni campanie"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {id && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/campaigns/${id}`}>Vezi campanie</Link>
                                </DropdownMenuItem>
                              )}
                              {id && (
                                <DropdownMenuItem
                                  disabled={isRowActionLoading(id)}
                                  onSelect={() => handleDuplicateCampaign(id)}
                                >
                                  <Copy className="mr-2 h-4 w-4" aria-hidden />
                                  {isRowActionLoading(id, "duplicate") ?
                                    "Se copiază..."
                                  : "Copiază ca draft"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {id && (
                                <DropdownMenuItem
                                  disabled={
                                    isRowActionLoading(id) ||
                                    (reportLoading && reportCampaignId === id)
                                  }
                                  onSelect={() => handleViewReport(id)}
                                >
                                  <BarChart3 className="mr-2 h-4 w-4" aria-hidden />
                                  Vezi raport
                                </DropdownMenuItem>
                              )}
                              {canRetryFailed && id && (
                                <DropdownMenuItem
                                  disabled={isRowActionLoading(id)}
                                  onSelect={() => handleRequeue(id)}
                                >
                                  Retrimite eșuate
                                </DropdownMenuItem>
                              )}
                              {canSendNow && id && (
                                <DropdownMenuItem
                                  disabled={isRowActionLoading(id)}
                                  onSelect={() => handleSendNow(id)}
                                >
                                  Trimite acum
                                </DropdownMenuItem>
                              )}
                              {canSchedule && id && (
                                <DropdownMenuItem
                                  disabled={isRowActionLoading(id)}
                                  onSelect={() => openScheduleRowDialog(id)}
                                >
                                  Programează
                                </DropdownMenuItem>
                              )}
                              {canUnschedule && id && (
                                <DropdownMenuItem
                                  disabled={isRowActionLoading(id)}
                                  onSelect={() => setUnscheduleTargetId(id)}
                                >
                                  Anulează programarea
                                </DropdownMenuItem>
                              )}
                              {id && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={isRowActionLoading(id)}
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onSelect={() => setDeleteRowTargetId(id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                                    Șterge
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              }

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {adminCommonLabels.page} {pageIndex + 1}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
                    value={pageSize}
                    disabled={loading}
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
                    disabled={loading || pageIndex <= 0}
                    onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                  >
                    {adminCommonLabels.previous}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading || !nextCursor}
                    onClick={() => setPageIndex((prev) => prev + 1)}
                  >
                    {adminCommonLabels.next}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabContent>
      </Tabs>

      {createActionDialogOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={handleCancelCreateDialogs}
        >
          <Card
            className="w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Alege acțiunea pentru campanie</CardTitle>
              <CardDescription>
                Campania va fi creată și apoi se aplică acțiunea selectată.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={() => executeCreateAction("draft")}
                disabled={submitting}
              >
                {submitting ? "Se procesează..." : "Salvează draft"}
              </Button>
              <Button
                className="w-full justify-start"
                variant="secondary"
                onClick={handleChooseScheduleAction}
                disabled={submitting}
              >
                Programează și salvează
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => executeCreateAction("send_now")}
                disabled={submitting}
              >
                {submitting ? "Se procesează..." : "Trimite acum"}
              </Button>
              <div className="pt-2">
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={handleCancelCreateDialogs}
                  disabled={submitting}
                >
                  Anulează
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {scheduleActionDialogOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={handleCancelCreateDialogs}
        >
          <Card
            className="w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Programează și salvează</CardTitle>
              <CardDescription>
                Selectează data și ora în fusul orar Europe/Bucharest.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Data și ora (Europe/Bucharest)
                </label>
                <Input
                  type="datetime-local"
                  value={createScheduleAtLocal}
                  onChange={(event) => setCreateScheduleAtLocal(event.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToActionDialog}
                  disabled={submitting}
                >
                  Înapoi
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelCreateDialogs}
                  disabled={submitting}
                >
                  Anulează
                </Button>
                <Button
                  onClick={() =>
                    executeCreateAction("schedule", createScheduleAtLocal)
                  }
                  disabled={submitting}
                >
                  {submitting ? "Se procesează..." : "Salvează programarea"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {scheduleRowDialogId && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-row-dialog-title"
          onClick={closeScheduleRowDialog}
        >
          <Card
            className="w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="schedule-row-dialog-title">
                Programează trimiterea
              </CardTitle>
              <CardDescription className="space-y-1">
                <span className="block font-medium text-foreground">
                  {scheduleRowDialogLabel}
                </span>
                <span>
                  Selectează data și ora în fusul orar {SCHEDULE_TIMEZONE}.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="schedule-row-datetime">
                  Data și ora ({SCHEDULE_TIMEZONE})
                </label>
                <Input
                  id="schedule-row-datetime"
                  type="datetime-local"
                  value={scheduleRowDialogAtLocal}
                  onChange={(event) =>
                    setScheduleRowDialogAtLocal(event.target.value)
                  }
                  disabled={isRowActionLoading(scheduleRowDialogId)}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeScheduleRowDialog}
                  disabled={isRowActionLoading(scheduleRowDialogId)}
                >
                  Anulează
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    handleSchedule(scheduleRowDialogId, scheduleRowDialogAtLocal)
                  }
                  disabled={isRowActionLoading(scheduleRowDialogId)}
                >
                  {isRowActionLoading(scheduleRowDialogId, "schedule") ?
                    "Se programează..."
                  : "Salvează programarea"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(unscheduleTargetId)}
        onOpenChange={(next) => {
          if (!next) {
            setUnscheduleTargetId(null);
          }
        }}
        title="Anulezi programarea?"
        description={
          <>
            Campanie: <strong>{unscheduleTargetLabel}</strong>. Trimiterea nu va mai
            porni automat la data și ora programate.
          </>
        }
        confirmLabel="Da, anulează programarea"
        cancelLabel="Închide"
        variant="destructive"
        onConfirm={() =>
          unscheduleTargetId ? handleUnschedule(unscheduleTargetId) : false
        }
        confirmDisabled={!unscheduleTargetId}
      />

      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Ștergi campaniile selectate?"
        description={`Sigur vrei să ștergi ${selectedIds.size} ${selectedIds.size === 1 ? "campanie" : "campanii"}? Acțiunea este ireversibilă.`}
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={selectedIds.size === 0}
        onConfirm={handleBulkDelete}
      />

      <AdminConfirmDialog
        open={deleteRowTargetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRowTargetId(null);
          }
        }}
        title="Ștergi această campanie?"
        description={
          <>
            Campanie: <strong>{deleteRowTargetLabel || "—"}</strong>. Acțiunea este
            ireversibilă.
          </>
        }
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={!deleteRowTargetId}
        onConfirm={handleDeleteRowConfirmed}
      />

      {reportDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeReportDialog}
        >
          <Card
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Raport campanie</CardTitle>
                <CardDescription>
                  Campanie: <span className="font-medium">{reportCampaignLabel}</span>
                </CardDescription>
              </div>
              <Button variant="outline" onClick={closeReportDialog}>
                Închide
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportError && <p className="text-sm text-rose-500">{reportError}</p>}
              {reportLoading && !reportData && !reportError ?
                <div className="space-y-4">
                  <AdminKpiRowSkeleton count={5} />
                  <div className="inline-flex w-full max-w-md gap-1 rounded-lg border border-border bg-muted/30 p-1">
                    <Skeleton className="h-9 flex-1 rounded-md" />
                    <Skeleton className="h-9 flex-1 rounded-md" />
                    <Skeleton className="h-9 flex-1 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <AdminTableSkeleton rows={6} columns={4} />
                  </div>
                </div>
              : null}

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

                  <Tabs defaultValue="report-destinatari" className="space-y-4">
                    <TabList className="inline-flex w-full flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1 sm:flex-nowrap">
                      <TabTrigger
                        value="report-destinatari"
                        className="min-h-9 flex-1 rounded-md px-2 py-2 text-center text-xs font-medium text-muted-foreground transition data-[active=true]:bg-background data-[active=true]:text-foreground sm:px-3 sm:text-sm"
                      >
                        Destinatari
                        {!reportJobsLoading ?
                          <span className="ml-1 tabular-nums text-muted-foreground/80">
                            ({reportJobsAll.length})
                          </span>
                        : null}
                      </TabTrigger>
                      <TabTrigger
                        value="report-esuate"
                        className="min-h-9 flex-1 rounded-md px-2 py-2 text-center text-xs font-medium text-muted-foreground transition data-[active=true]:bg-background data-[active=true]:text-foreground sm:px-3 sm:text-sm"
                      >
                        Joburi eșuate
                        <span className="ml-1 tabular-nums text-muted-foreground/80">
                          ({reportData.failedJobs.length})
                        </span>
                      </TabTrigger>
                      <TabTrigger
                        value="report-loguri"
                        className="min-h-9 flex-1 rounded-md px-2 py-2 text-center text-xs font-medium text-muted-foreground transition data-[active=true]:bg-background data-[active=true]:text-foreground sm:px-3 sm:text-sm"
                      >
                        Ultimele loguri
                        <span className="ml-1 tabular-nums text-muted-foreground/80">
                          ({reportData.logs.length})
                        </span>
                      </TabTrigger>
                    </TabList>

                    <TabContent value="report-destinatari" className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Toți destinatarii campaniei (joburi). Folosește filtrele pentru a restrânge lista.
                      </p>
                      {reportJobsLoading && (
                        <AdminTableSkeleton rows={6} columns={4} />
                      )}
                      {reportJobsError && (
                        <p className="text-xs text-rose-600">{reportJobsError}</p>
                      )}
                      {!reportJobsLoading && !reportJobsError && reportJobsAll.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Nu există joburi pentru această campanie.
                        </p>
                      )}
                      {!reportJobsLoading &&
                        !reportJobsError &&
                        reportJobsAll.length > 0 &&
                        reportJobsProcessedCount === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Niciun destinatar nu corespunde filtrelor curente.
                          </p>
                        )}
                      {!reportJobsLoading && !reportJobsError && reportJobsProcessedCount > 0 && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                Căutare email
                              </label>
                              <Input
                                className="h-9 w-[min(100%,16rem)]"
                                placeholder="Fragment email…"
                                value={reportJobsSearch}
                                onChange={(event) => {
                                  setReportJobsSearch(event.target.value);
                                  setReportJobsPageIndex(0);
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                Filtru status
                              </label>
                              <select
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                value={reportJobsStatusFilter}
                                onChange={(event) => {
                                  setReportJobsStatusFilter(
                                    event.target.value as ReportJobsStatusFilter
                                  );
                                  setReportJobsPageIndex(0);
                                }}
                              >
                                <option value="all">Toate</option>
                                <option value="failed">Doar eșuate</option>
                                <option value="with_errors">Cu erori (eșuate + ignorate cu motiv)</option>
                                <option value="sent">Trimise</option>
                                <option value="skipped">Ignorate</option>
                                <option value="queued">În coadă</option>
                                <option value="sending">În trimitere</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                Sortare
                              </label>
                              <select
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                value={`${reportJobsSortField}:${reportJobsSortDir}`}
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  const colon = raw.indexOf(":");
                                  const field = raw.slice(0, colon) as "email" | "status" | "updatedAt";
                                  const dir = raw.slice(colon + 1) as "asc" | "desc";
                                  setReportJobsSortField(field);
                                  setReportJobsSortDir(dir);
                                  setReportJobsPageIndex(0);
                                }}
                              >
                                <option value="email:asc">Email A → Z</option>
                                <option value="email:desc">Email Z → A</option>
                                <option value="status:asc">Status A → Z</option>
                                <option value="status:desc">Status Z → A</option>
                                <option value="updatedAt:desc">Cel mai recent</option>
                                <option value="updatedAt:asc">Cel mai vechi</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                              {reportJobsProcessedCount} destinatari
                              {reportJobsTotalPages > 0 ?
                                <> · pagina {reportJobsPageIndex + 1} din {reportJobsTotalPages}</>
                              : null}
                              {" · "}
                              maxim {REPORT_JOBS_PAGE_SIZE} pe pagină
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={reportJobsPageIndex <= 0}
                                onClick={() => setReportJobsPageIndex((p) => Math.max(0, p - 1))}
                              >
                                Anterior
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  reportJobsTotalPages <= 0 ||
                                  reportJobsPageIndex >= reportJobsTotalPages - 1
                                }
                                onClick={() =>
                                  setReportJobsPageIndex((p) =>
                                    reportJobsTotalPages > 0 ?
                                      Math.min(reportJobsTotalPages - 1, p + 1)
                                    : p
                                  )
                                }
                              >
                                Următor
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Motiv / detalii</TableHead>
                                  <TableHead>Trimis la</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {reportJobsPageItems.map((job) => {
                                  const jobId = typeof job.id === "string" ? job.id : "";
                                  const email = typeof job.email === "string" ? job.email : "-";
                                  const rawStatus =
                                    typeof job.status === "string" ?
                                      job.status.trim().toLowerCase()
                                    : "";
                                  const motif = formatCampaignJobMotif(job);
                                  const sentAt =
                                    job.sentAt != null ?
                                      formatAdminDateTime(job.sentAt, { includeSeconds: true })
                                    : "—";
                                  return (
                                    <TableRow key={jobId || email}>
                                      <TableCell className="max-w-[200px] truncate font-mono text-xs">
                                        {email}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={campaignJobBadgeVariant(rawStatus)}>
                                          {campaignJobStatusLabel(rawStatus)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="max-w-md text-xs text-muted-foreground">
                                        {motif}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                        {rawStatus === "sent" ? sentAt : "—"}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </TabContent>

                    <TabContent value="report-esuate" className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Rezumat din raport pentru trimiterile eșuate (detalii din API).
                      </p>
                      {reportData.failedJobs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nu există joburi eșuate.</p>
                      ) : (
                        <div className="space-y-2">
                          {reportData.failedJobs.map((job) => (
                            <div
                              key={job.id || `${job.email}-${job.lastError}`}
                              className="rounded-md border p-3 text-xs"
                            >
                              <p>
                                <strong>Email:</strong> {job.email || "-"}
                              </p>
                              <p>
                                <strong>Motiv:</strong> {job.lastError || "-"}
                              </p>
                              <p>
                                <strong>Cod:</strong> {job.errorCode || "-"}
                              </p>
                              <p>
                                <strong>Tip:</strong> {job.errorKind || "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabContent>

                    <TabContent value="report-loguri" className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Evenimente recente înregistrate pentru această campanie.
                      </p>
                      {reportData.logs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nu există loguri pentru această campanie.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {reportData.logs.map((log, index) => (
                            <div
                              key={`${log.id || index}-${log.message || ""}`}
                              className="rounded-md border p-3 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">
                                  {formatAdminDateTime(log.createdAt, {
                                    includeSeconds: true,
                                  })}
                                </span>
                                <Badge variant={log.level === "error" ? "danger" : "secondary"}>
                                  {logLevelLabel(log.level)}
                                </Badge>
                              </div>
                              <p className="mt-1">{log.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabContent>
                  </Tabs>

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
        </div>
      )}
    </div>
  );
}

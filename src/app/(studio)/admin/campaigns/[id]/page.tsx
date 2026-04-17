"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { adminFetch } from "@/components/admin/adminApi";
import {
  AdminFormGridSkeleton,
} from "@/components/admin/AdminSkeletonLayouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  campaignTemplateList,
  getCampaignTemplateDefinition,
  getDefaultTemplateData,
  isCampaignTemplateId,
  normalizePublicBaseUrl,
  renderCampaignTemplate,
  validateCampaignTemplateInput,
  type CampaignTemplateId,
} from "@/lib/emailTemplates/campaignTemplates";
import { campaignStatusLabel } from "@/lib/adminLabels";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

type NewsletterSettingsResponse = {
  item: {
    baseUrl?: string;
  } | null;
};

type CampaignGetResponse = {
  item: Record<string, unknown> & { id?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCampaignStatus(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function campaignBadgeVariant(
  status: string
): "success" | "warning" | "danger" | "outline" {
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

function mergeLoadedTemplateData(
  templateId: CampaignTemplateId,
  saved: unknown
): Record<string, string> {
  const defaults = getDefaultTemplateData(templateId);
  if (!isRecord(saved)) {
    return defaults;
  }
  const next = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const v = saved[key];
    if (typeof v === "string") {
      next[key] = v;
    }
  }
  return next;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Record<string, unknown> | null>(null);

  const [baseUrl, setBaseUrl] = useState("");
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [templateId, setTemplateId] = useState<CampaignTemplateId>("updates");
  const [templateData, setTemplateData] = useState<Record<string, string>>(() =>
    getDefaultTemplateData("updates")
  );
  const [legacyMode, setLegacyMode] = useState(false);
  const [legacyHtml, setLegacyHtml] = useState("");

  const [saving, setSaving] = useState(false);

  const templateScrollRef = useRef<HTMLDivElement>(null);
  const skipNextTemplateDataReset = useRef(false);
  const [templateScrollEdges, setTemplateScrollEdges] = useState({
    atStart: true,
    atEnd: true,
  });

  const status = useMemo(
    () => (campaign ? normalizeCampaignStatus(campaign.status) : ""),
    [campaign]
  );
  const editable = status === "draft" || status === "scheduled";

  const selectedTemplate = getCampaignTemplateDefinition(templateId);

  const templateValidation = useMemo(
    () =>
      legacyMode ?
        { errors: [] as string[], normalizedData: {} as Record<string, string> }
      : validateCampaignTemplateInput({
          templateId,
          templateData,
        }),
    [legacyMode, templateData, templateId]
  );

  const previewHtml = useMemo(() => {
    if (legacyMode) {
      return legacyHtml;
    }
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
  }, [baseUrl, legacyHtml, legacyMode, subject, templateData, templateId]);

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

  useEffect(() => {
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
  }, [updateTemplateScrollEdges, templateId, legacyMode]);

  const applyCampaignToForm = useCallback((item: Record<string, unknown>) => {
    skipNextTemplateDataReset.current = true;
    setSubject(
      typeof item.subject === "string" && item.subject.trim() ?
        item.subject.trim()
      : typeof item.name === "string" ?
        item.name.trim()
      : ""
    );
    setPreviewText(
      typeof item.previewText === "string" ? item.previewText : ""
    );

    const tid = item.templateId;
    if (isCampaignTemplateId(tid)) {
      setLegacyMode(false);
      setTemplateId(tid);
      setTemplateData(mergeLoadedTemplateData(tid, item.templateData));
      setLegacyHtml("");
    } else {
      setLegacyMode(true);
      setTemplateId("updates");
      setTemplateData(getDefaultTemplateData("updates"));
      setLegacyHtml(typeof item.html === "string" ? item.html : "");
    }
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setLoadError("Lipsește ID-ul campaniei.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [campaignRes, settingsRes] = await Promise.all([
        adminFetch(`/api/admin/newsletter/campaigns/${id}`),
        adminFetch("/api/admin/newsletter/settings"),
      ]);

      if (!settingsRes.ok) {
        setSettingsError(await readErrorMessage(settingsRes, "Nu am putut încărca setările."));
      } else {
        setSettingsError(null);
        const settingsJson = (await settingsRes.json()) as NewsletterSettingsResponse;
        const raw =
          typeof settingsJson?.item?.baseUrl === "string" ?
            settingsJson.item.baseUrl
          : "";
        setBaseUrl(normalizePublicBaseUrl(raw));
      }

      if (!campaignRes.ok) {
        setCampaign(null);
        setLoadError(await readErrorMessage(campaignRes, "Campania nu a fost găsită."));
        return;
      }

      const json = (await campaignRes.json()) as CampaignGetResponse;
      const item = json.item;
      if (!item || typeof item !== "object") {
        setCampaign(null);
        setLoadError("Răspuns neașteptat de la server.");
        return;
      }
      setCampaign(item);
      applyCampaignToForm(item);
    } catch (error) {
      setCampaign(null);
      setLoadError(error instanceof Error ? error.message : "Eroare la încărcare.");
    } finally {
      setLoading(false);
    }
  }, [id, applyCampaignToForm]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (skipNextTemplateDataReset.current) {
      skipNextTemplateDataReset.current = false;
      return;
    }
    if (legacyMode || !editable) {
      return;
    }
    setTemplateData(getDefaultTemplateData(templateId));
  }, [templateId, legacyMode, editable]);

  function handleTemplateFieldChange(key: string, value: string) {
    if (!editable) {
      return;
    }
    setTemplateData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!editable || !id) {
      return;
    }
    if (!subject.trim()) {
      toast.error("Subiectul este obligatoriu.");
      return;
    }
    if (!legacyMode && !baseUrl) {
      toast.error("Setează URL-ul public de bază în Setări newsletter.");
      return;
    }
    if (!legacyMode && templateValidation.errors.length > 0) {
      toast.error(templateValidation.errors[0]);
      return;
    }
    if (legacyMode && !legacyHtml.trim()) {
      toast.error("HTML-ul campaniei nu poate fi gol.");
      return;
    }

    setSaving(true);
    try {
      const body = legacyMode ?
        {
          subject: subject.trim(),
          previewText: previewText.trim() || null,
          html: legacyHtml,
          text: typeof campaign?.text === "string" ? campaign.text : null,
        }
      : {
          subject: subject.trim(),
          previewText: previewText.trim() || null,
          templateId,
          templateData: templateValidation.normalizedData,
        };

      const response = await adminFetch(`/api/admin/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response, "Nu am putut salva modificările."));
        return;
      }
      toast.success("Modificările au fost salvate.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-600">ID campanie invalid.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/campaigns">Înapoi la campanii</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && !loading && (
        <p className="text-sm text-rose-600">
          {loadError}{" "}
          <Button
            type="button"
            variant="ghost"
            className="h-auto p-0 text-rose-700 underline"
            onClick={() => void load()}
          >
            Reîncearcă
          </Button>
        </p>
      )}

      {loading ?
        <>
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
              <Link href="/admin/campaigns">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Toate campaniile
              </Link>
            </Button>
            <Skeleton className="h-8 w-[min(100%,28rem)]" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
            </CardHeader>
            <CardContent className="space-y-5">
              <AdminFormGridSkeleton fields={8} />
              <Skeleton className="h-[min(400px,55vh)] w-full rounded-md" />
            </CardContent>
          </Card>
        </>
      : <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
                <Link href="/admin/campaigns">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Toate campaniile
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold">
                {(campaign?.subject as string) || "Campanie"}
              </h1>
              {campaign && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={campaignBadgeVariant(status)}>
                    {campaignStatusLabel(
                      typeof campaign.status === "string" ? campaign.status : undefined
                    )}
                  </Badge>
                  {formatAdminDateTime(campaign.createdAt) !== "-" && (
                    <span>Creată: {formatAdminDateTime(campaign.createdAt)}</span>
                  )}
                  {formatAdminDateTime(campaign.scheduledAt) !== "-" && (
                    <span>Programată: {formatAdminDateTime(campaign.scheduledAt)}</span>
                  )}
                </div>
              )}
            </div>
            {editable && (
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Se salvează…" : "Salvează"}
              </Button>
            )}
          </div>

          {campaign && (
        <Card>
          <CardHeader>
            <CardTitle>Conținut</CardTitle>
            <CardDescription>
              {editable ?
                "Editează subiectul, previzualizarea și template-ul. Modificările rescriu HTML-ul salvat."
              : "Această campanie este doar în citire în acest status (inclusiv în coadă / în trimitere / trimisă). Folosește „Copiază ca draft” din listă pentru o variantă editabilă."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {settingsError && <p className="text-sm text-rose-500">{settingsError}</p>}
            {!baseUrl && !legacyMode && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Setează câmpul <strong>URL public de bază</strong> în Setări pentru a previzualiza
                și salva campaniile bazate pe template.
              </p>
            )}
            {isLocalBaseUrl && !legacyMode && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                URL-ul public de bază este local ({baseUrl}). Previzualizarea merge local, dar
                imaginile din email nu se vor încărca în inbox extern.
              </p>
            )}

            {!legacyMode && (
              <div className="flex items-stretch gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-center"
                  aria-label="Derulează template-uri la stânga"
                  disabled={!editable || templateScrollEdges.atStart}
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
                      disabled={!editable}
                      onClick={() => editable && setTemplateId(template.id)}
                      className={`w-[min(260px,85vw)] shrink-0 snap-start rounded-md border p-3 text-left transition ${
                        templateId === template.id ?
                          "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                      } ${!editable ? "cursor-default opacity-80" : ""}`}
                    >
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-center"
                  aria-label="Derulează template-uri la dreapta"
                  disabled={!editable || templateScrollEdges.atEnd}
                  onClick={() => scrollTemplateStrip(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {legacyMode && (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Campanie <strong>fără template</strong> (HTML salvat direct).{" "}
                {editable ? "Poți edita HTML-ul mai jos." : "Previzualizare din HTML-ul livrat."}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subiect</label>
                <Input
                  value={subject}
                  onChange={(event) => editable && setSubject(event.target.value)}
                  disabled={!editable}
                  placeholder="Subiect"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Text previzualizare (opțional)</label>
                <Input
                  value={previewText}
                  onChange={(event) => editable && setPreviewText(event.target.value)}
                  disabled={!editable}
                  placeholder="Rezumat scurt vizibil în inbox"
                />
              </div>
            </div>

            {!legacyMode && (
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
                        className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        rows={field.rows || 4}
                        placeholder={field.placeholder}
                        value={templateData[field.key] || ""}
                        onChange={(event) =>
                          handleTemplateFieldChange(field.key, event.target.value)
                        }
                        disabled={!editable}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        value={templateData[field.key] || ""}
                        onChange={(event) =>
                          handleTemplateFieldChange(field.key, event.target.value)
                        }
                        disabled={!editable}
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
                        disabled={!editable}
                      />
                    )}
                    {field.helperText && (
                      <p className="text-xs text-muted-foreground">{field.helperText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {legacyMode && editable && (
              <div className="space-y-2">
                <label className="text-sm font-medium">HTML</label>
                <textarea
                  className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                  value={legacyHtml}
                  onChange={(event) => setLegacyHtml(event.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Previzualizare</label>
              {!legacyMode && !baseUrl ?
                <p className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Previzualizare indisponibilă până setezi URL-ul public de bază.
                </p>
              : !legacyMode && templateValidation.errors.length > 0 ?
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {templateValidation.errors[0]}
                </p>
              : !previewHtml ?
                <p className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Nu există conținut de afișat.
                </p>
              : <iframe
                  title="Previzualizare campanie"
                  className="h-[min(520px,70vh)] w-full rounded-md border border-border bg-white"
                  srcDoc={previewHtml}
                />
              }
            </div>

            {!legacyMode && (
              <p className="text-xs text-muted-foreground">
                Template: <strong>{selectedTemplate.name}</strong>
              </p>
            )}

            {editable && (
              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Se salvează…" : "Salvează"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
          )}
        </>
      }
    </div>
  );
}

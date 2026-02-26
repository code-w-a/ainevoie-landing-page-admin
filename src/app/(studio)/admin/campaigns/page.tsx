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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type NewsletterSettingsResponse = {
  item: {
    baseUrl?: string;
  } | null;
};

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

  const cursor = cursors[pageIndex];
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    if (cursor) params.set("cursor", cursor);
    if (statusFilter !== "all") params.set("status", statusFilter);
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

  const campaigns = data?.items ?? [];
  const nextCursor = data?.nextCursor ?? null;
  const rawBaseUrl = typeof settingsData?.item?.baseUrl === "string"
    ? settingsData.item.baseUrl
    : "";
  const baseUrl = useMemo(() => normalizePublicBaseUrl(rawBaseUrl), [rawBaseUrl]);
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
  const selectedTemplate = getCampaignTemplateDefinition(templateId);

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

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return campaigns;
    return campaigns.filter((campaign) => {
      const name = (campaign.subject || campaign.name || "").toLowerCase();
      return name.includes(normalizedSearch);
    });
  }, [campaigns, search]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
        subject: subject || "Preview campanie",
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

  async function handleCreate() {
    setCreateError(null);
    setCreateSuccess(null);
    if (!subject.trim()) {
      setCreateError("Subject este obligatoriu.");
      return;
    }
    if (!baseUrl) {
      setCreateError("Setează Public base URL în Newsletter Settings.");
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
        setCreateError(
          await readErrorMessage(response, "Nu am putut crea campania.")
        );
        return;
      }

      setCreateSuccess("Campania a fost creată și pusă în coadă.");
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
      setTestError("Subject este obligatoriu pentru test.");
      return;
    }
    if (!baseUrl) {
      setTestError("Setează Public base URL în Newsletter Settings.");
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
      await adminFetch(`/api/admin/newsletter/campaigns/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, html: editHtml }),
      });
      setEditId(null);
      setEditSubject("");
      setEditHtml("");
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequeue(id: string) {
    if (!id) return;
    await adminFetch(`/api/admin/newsletter/campaigns/${id}/requeue`, {
      method: "POST",
    });
    reload();
  }

  async function handleBulkRequeue() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/campaigns/${id}/requeue`, {
          method: "POST",
        })
      )
    );
    reload();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/campaigns/${id}`, { method: "DELETE" })
      )
    );
    setSelectedIds(new Set());
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Creează campanii din template-uri, fără HTML manual.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={submitting || settingsLoading || !baseUrl}
        >
          {submitting ? "Creating..." : "Create campaign"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create campaign</CardTitle>
          <CardDescription>
            Selectează un template, completează câmpurile și verifică preview-ul.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {settingsError && (
            <p className="text-sm text-rose-500">{settingsError}</p>
          )}
          {!baseUrl && !settingsLoading && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Setează câmpul <strong>Public base URL</strong> în Settings pentru a
              activa creatorul de campanii.
            </p>
          )}
          {isLocalBaseUrl && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Public base URL este local ({baseUrl}). Preview-ul merge local, dar
              imaginile din email nu se vor încărca în inbox extern.
            </p>
          )}
          {createError && <p className="text-sm text-rose-500">{createError}</p>}
          {createSuccess && (
            <p className="text-sm text-emerald-600">{createSuccess}</p>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            {campaignTemplateList.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setTemplateId(template.id)}
                className={`rounded-md border p-3 text-left transition ${
                  templateId === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
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
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Noutăți AInevoie"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview text (opțional)</label>
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
                className={`space-y-2 ${
                  field.type === "textarea" ? "md:col-span-2" : ""
                }`}
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
              <label className="text-sm font-medium">Preview</label>
              {!baseUrl ? (
                <p className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Preview indisponibil până setezi Public base URL.
                </p>
              ) : templateValidation.errors.length > 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {templateValidation.errors[0]}
                </p>
              ) : (
                <iframe
                  title="Campaign preview"
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
                  {sendingTest ? "Sending..." : "Trimite test"}
                </Button>
              </div>
              {testError && <p className="text-sm text-rose-500">{testError}</p>}
              {testSuccess && (
                <p className="text-sm text-emerald-600">{testSuccess}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Template selectat: <strong>{selectedTemplate.name}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit campaign</CardTitle>
          <CardDescription>Actualizează subject-ul și HTML-ul.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
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
              {submitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditId(null);
                setEditSubject("");
                setEditHtml("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
          <CardDescription>Lista completă a campaniilor existente.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading campaigns...</p>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              className="max-w-xs"
              placeholder="Search campaigns"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="createdAt">Newest</option>
              <option value="subject">Subject</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="total">Total</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sortDir}
              onChange={(event) => setSortDir(event.target.value)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <Button
              variant="outline"
              onClick={handleBulkRequeue}
              disabled={selectedIds.size === 0}
            >
              Requeue selected
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
            >
              Delete selected
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
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const id = campaign.id as string | undefined;
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
                    <TableCell className="font-medium">
                      {campaign.subject || campaign.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "sent" || campaign.status === "Sent"
                            ? "success"
                            : campaign.status === "queued" ||
                                campaign.status === "Queued"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.stats?.total ?? campaign.recipients ?? "-"}
                    </TableCell>
                    <TableCell>{campaign.stats?.sent ?? campaign.sent ?? "-"}</TableCell>
                    <TableCell>
                      {campaign.stats?.failed ?? campaign.failed ?? "-"}
                    </TableCell>
                    <TableCell>{campaign.createdAt ?? "-"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(id ?? null);
                          setEditSubject(campaign.subject || "");
                          setEditHtml(campaign.html || "");
                        }}
                        disabled={!id}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRequeue(id || "")}
                        disabled={!id}
                      >
                        Requeue failed
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Page {pageIndex + 1}</span>
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
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!nextCursor}
                onClick={() => setPageIndex((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

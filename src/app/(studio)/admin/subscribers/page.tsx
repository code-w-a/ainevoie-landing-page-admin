"use client";

import { useMemo, useState, useEffect } from "react";

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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch } from "@/components/admin/adminApi";
import { adminCommonLabels, subscriberStatusLabel } from "@/lib/adminLabels";
import {
  NEWSLETTER_SUBSCRIBER_STATUSES,
  type NewsletterSubscriberStatus,
} from "@/types/newsletter";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_LABELS: Record<NewsletterSubscriberStatus, string> = {
  active: "Activ",
  unsubscribed: "Dezabonat",
  bounced: "Bounce",
  complaint: "Plângere",
  suppressed: "Suprimat",
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

export default function SubscribersPage() {
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<NewsletterSubscriberStatus>("active");
  const [statusReason, setStatusReason] = useState("");
  const [consentGranted, setConsentGranted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    return `/api/admin/newsletter/subscribers?${params.toString()}`;
  }, [cursor, pageSize, sortBy, sortDir, statusFilter]);

  const { data, loading, error, reload } = useAdminData<{
    items: any[];
    nextCursor: string | null;
  }>(endpoint);

  const subscribers = useMemo(() => data?.items ?? [], [data?.items]);
  const nextCursor = data?.nextCursor ?? null;

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

  const filteredSubscribers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return subscribers;
    }

    return subscribers.filter((subscriber) => {
      const emailValue = (subscriber.email || "").toLowerCase();
      const tagValue = (subscriber.tags || []).join(",").toLowerCase();
      const reasonValue = (subscriber.statusReason || "").toLowerCase();
      return (
        emailValue.includes(normalizedSearch) ||
        tagValue.includes(normalizedSearch) ||
        reasonValue.includes(normalizedSearch)
      );
    });
  }, [subscribers, search]);

  const pageIds = filteredSubscribers
    .map((subscriber) => subscriber.id)
    .filter(Boolean) as string[];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

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
    setActionError(null);
    setActionSuccess(null);

    if (!email.trim()) {
      setActionError("Emailul este obligatoriu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminFetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          status,
          statusReason: statusReason.trim() || null,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          consentGranted,
          consentSource: "admin_manual",
          consentTextVersion: "v1",
          consentMethod: "single_opt_in",
          source: "admin_manual",
        }),
      });

      if (!response.ok) {
        setActionError(await readErrorMessage(response, "Nu am putut salva abonatul."));
        return;
      }

      setEmail("");
      setTags("");
      setStatus("active");
      setStatusReason("");
      setConsentGranted(true);
      setActionSuccess("Abonatul a fost salvat.");
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkStatus(nextStatus: NewsletterSubscriberStatus) {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    const responses = await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/subscribers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        })
      )
    );

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      setActionError(
        await readErrorMessage(failed, "Nu am putut actualiza statusul pentru selecție.")
      );
      return;
    }

    setSelectedIds(new Set());
    setActionSuccess(`Status actualizat: ${subscriberStatusLabel(nextStatus)}.`);
    reload();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    const responses = await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/subscribers/${id}`, {
          method: "DELETE",
        })
      )
    );

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      setActionError(
        await readErrorMessage(failed, "Nu am putut șterge selecția de abonați.")
      );
      return;
    }

    setSelectedIds(new Set());
    setActionSuccess("Abonații selectați au fost șterși.");
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Abonați</h1>
        <p className="text-sm text-muted-foreground">
          Lifecycle complet: active, unsubscribed, bounced, complaint, suppressed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adaugă abonat</CardTitle>
          <CardDescription>
            Adaugă manual un abonat cu status și consimțământ simplificat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
          {actionSuccess && <p className="text-sm text-emerald-600">{actionSuccess}</p>}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="email@exemplu.ro"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as NewsletterSubscriberStatus)
                }
              >
                {NEWSLETTER_SUBSCRIBER_STATUSES.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {STATUS_LABELS[statusValue]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Etichete</label>
              <Input
                placeholder="bucuresti, client"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motiv status (opțional)</label>
              <Input
                placeholder="Ex: hard bounce SMTP"
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={consentGranted}
                onChange={(event) => setConsentGranted(event.target.checked)}
              />
              Consimțământ acordat (single opt-in)
            </label>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Se salvează..." : "Adaugă"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toți abonații</CardTitle>
          <CardDescription>
            Trimiterile merg doar către status <strong>active</strong> cu
            <strong> consentGranted=true</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">{adminCommonLabels.loadingSubscribers}</p>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              className="max-w-xs"
              placeholder="Caută email, etichete sau motiv"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">{adminCommonLabels.allStatuses}</option>
              {NEWSLETTER_SUBSCRIBER_STATUSES.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {STATUS_LABELS[statusValue]}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="createdAt">{adminCommonLabels.newest}</option>
              <option value="email">Email</option>
              <option value="status">Status</option>
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
              onClick={() => handleBulkStatus("active")}
              disabled={selectedIds.size === 0}
            >
              Setează activ
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatus("unsubscribed")}
              disabled={selectedIds.size === 0}
            >
              Setează dezabonat
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatus("complaint")}
              disabled={selectedIds.size === 0}
            >
              Setează plângere
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatus("suppressed")}
              disabled={selectedIds.size === 0}
            >
              Setează suprimat
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatus("bounced")}
              disabled={selectedIds.size === 0}
            >
              Setează bounced
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
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Consimțământ</TableHead>
                <TableHead>Motiv status</TableHead>
                <TableHead>Etichete</TableHead>
                <TableHead>Ultima trimitere</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => {
                const id = subscriber.id as string | undefined;
                const statusValue =
                  typeof subscriber.status === "string" ?
                    subscriber.status.toLowerCase() :
                    "";
                const isActive = statusValue === "active";
                const hasConsent = subscriber.consentGranted === true;

                return (
                  <TableRow key={id || subscriber.email}>
                    <TableCell>
                      <Checkbox
                        checked={id ? selectedIds.has(id) : false}
                        onChange={(event) =>
                          id ? toggleRow(id, event.target.checked) : undefined
                        }
                        disabled={!id}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "success" : "outline"}>
                        {subscriberStatusLabel(subscriber.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hasConsent ? "success" : "danger"}>
                        {hasConsent ? "Acordat" : "Retras"}
                      </Badge>
                    </TableCell>
                    <TableCell>{subscriber.statusReason || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(subscriber.tags || []).map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{subscriber.lastSentAt ?? "-"}</TableCell>
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
    </div>
  );
}

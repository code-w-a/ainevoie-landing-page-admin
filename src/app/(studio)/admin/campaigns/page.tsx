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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function CampaignsPage() {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const campaigns = data?.items ?? [];
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
    if (!subject || !html) {
      return;
    }
    setSubmitting(true);
    try {
      await adminFetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      });
      setSubject("");
      setHtml("");
      reload();
    } finally {
      setSubmitting(false);
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
            Gestionează campaniile și statusurile lor.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={submitting}>
          {submitting ? "Creating..." : "New campaign"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create campaign</CardTitle>
          <CardDescription>
            Trimite o campanie nouă prin Firebase Functions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              placeholder="Noutăți AInevoie"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">HTML</label>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="<h1>Salut!</h1><p>Avem noutăți.</p>"
              value={html}
              onChange={(event) => setHtml(event.target.value)}
            />
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
                          : campaign.status === "queued" || campaign.status === "Queued"
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
              );})}
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

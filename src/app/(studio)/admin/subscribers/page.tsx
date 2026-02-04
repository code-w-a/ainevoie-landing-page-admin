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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function SubscribersPage() {
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    return `/api/admin/newsletter/subscribers?${params.toString()}`;
  }, [cursor, pageSize, sortBy, sortDir, statusFilter]);

  const { data, loading, error, reload } = useAdminData<{
    items: any[];
    nextCursor: string | null;
  }>(endpoint);

  const subscribers = data?.items ?? [];
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
    if (!normalizedSearch) return subscribers;
    return subscribers.filter((subscriber) => {
      const emailValue = (subscriber.email || "").toLowerCase();
      const tagValue = (subscriber.tags || []).join(",").toLowerCase();
      return (
        emailValue.includes(normalizedSearch) ||
        tagValue.includes(normalizedSearch)
      );
    });
  }, [subscribers, search]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    if (!email) {
      return;
    }
    setSubmitting(true);
    try {
      await adminFetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      setEmail("");
      setTags("");
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkStatus(status: "active" | "unsubscribed") {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/subscribers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    );
    setSelectedIds(new Set());
    reload();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        adminFetch(`/api/admin/newsletter/subscribers/${id}`, {
          method: "DELETE",
        })
      )
    );
    setSelectedIds(new Set());
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscribers</h1>
        <p className="text-sm text-muted-foreground">
          Lista de abonați și statusul lor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add subscriber</CardTitle>
          <CardDescription>Adaugă manual un abonat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.5fr_1.5fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              placeholder="email@exemplu.ro"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="bucuresti, client"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? "Saving..." : "Add"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All subscribers</CardTitle>
          <CardDescription>Abonații activi și cei dezabonați.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading subscribers...</p>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              className="max-w-xs"
              placeholder="Search email or tags"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="createdAt">Newest</option>
              <option value="email">Email</option>
              <option value="status">Status</option>
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
              onClick={() => handleBulkStatus("active")}
              disabled={selectedIds.size === 0}
            >
              Set active
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatus("unsubscribed")}
              disabled={selectedIds.size === 0}
            >
              Set unsubscribed
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
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => {
                const id = subscriber.id as string | undefined;
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
                    <TableCell className="font-medium">
                      {subscriber.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          subscriber.status === "active" ||
                          subscriber.status === "Active"
                            ? "success"
                            : "outline"
                        }
                      >
                        {subscriber.status}
                      </Badge>
                    </TableCell>
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

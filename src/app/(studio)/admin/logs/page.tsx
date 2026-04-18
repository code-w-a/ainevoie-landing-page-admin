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
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { adminCommonLabels, logLevelLabel } from "@/lib/adminLabels";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
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
    if (levelFilter !== "all") params.set("level", levelFilter);
    return `/api/admin/newsletter/logs?${params.toString()}`;
  }, [cursor, pageSize, sortBy, sortDir, levelFilter]);

  const { data, loading, error } = useAdminData<{ items: any[]; nextCursor: string | null }>(
    endpoint
  );
  const { data: campaignsData } = useAdminData<{ items: any[] }>(
    "/api/admin/newsletter/campaigns?limit=200&sortBy=createdAt&sortDir=desc"
  );
  const logs = useMemo(() => data?.items ?? [], [data?.items]);
  const campaigns = useMemo(() => campaignsData?.items ?? [], [campaignsData?.items]);
  const campaignNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const campaign of campaigns) {
      const id = typeof campaign?.id === "string" ? campaign.id : "";
      const label =
        (typeof campaign?.subject === "string" && campaign.subject.trim()) ||
        (typeof campaign?.name === "string" && campaign.name.trim()) ||
        "";
      if (id && label) {
        map.set(id, label);
      }
    }
    return map;
  }, [campaigns]);
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
  }, [pageSize, sortBy, sortDir, levelFilter]);

  const resolveCampaignLabel = (log: any): string => {
    if (typeof log?.campaignName === "string" && log.campaignName.trim()) {
      return log.campaignName.trim();
    }
    if (typeof log?.campaignId === "string" && log.campaignId) {
      return (
        campaignNameById.get(log.campaignId) || adminCommonLabels.deletedCampaign
      );
    }
    return "-";
  };

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return logs;
    return logs.filter((log) => {
      const message = (log.message || "").toLowerCase();
      const campaign = (log.campaignId || "").toLowerCase();
      const persistedName =
        typeof log.campaignName === "string" ?
          log.campaignName.toLowerCase()
        : "";
      const liveName =
        typeof log.campaignId === "string" ?
          (campaignNameById.get(log.campaignId) || "").toLowerCase()
        : "";
      return (
        message.includes(normalizedSearch) ||
        campaign.includes(normalizedSearch) ||
        persistedName.includes(normalizedSearch) ||
        liveName.includes(normalizedSearch)
      );
    });
  }, [logs, search, campaignNameById]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Loguri</h1>
        <p className="text-sm text-muted-foreground">
          Evenimente recente din pipeline-ul de newsletter.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loguri de livrare</CardTitle>
          <CardDescription>Mesaje de status și erori.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              className="max-w-xs"
              placeholder="Caută în loguri"
              value={search}
              disabled={loading}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
              value={levelFilter}
              disabled={loading}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="all">Toate nivelele</option>
              <option value="info">Info</option>
              <option value="warning">Avertisment</option>
              <option value="error">Eroare</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
              value={sortBy}
              disabled={loading}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="createdAt">{adminCommonLabels.newest}</option>
              <option value="level">Nivel</option>
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
          </div>
          {loading ?
            <AdminTableSkeleton rows={10} columns={4} />
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Campanie</TableHead>
                  <TableHead>Timp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow key={`${log.message || log.id}-${index}`}>
                    <TableCell>
                      <Badge variant={log.level === "error" ? "danger" : "secondary"}>
                        {logLevelLabel(log.level)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate">
                      {log.message}
                    </TableCell>
                    <TableCell>{resolveCampaignLabel(log)}</TableCell>
                    <TableCell>
                      {formatAdminDateTime(log.createdAt, { includeSeconds: true })}
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}

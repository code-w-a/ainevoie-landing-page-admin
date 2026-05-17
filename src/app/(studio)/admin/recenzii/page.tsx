"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, EyeOff, Filter, Search, Save, Trash2, X } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { runAdminBulkDelete, useAdminBulkSelection } from "@/components/admin/useAdminBulkSelection";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReviewStatus = "published" | "hidden_by_admin" | "deleted_by_admin";

type ReviewAdminListItem = {
  reviewId: string;
  bookingId: string;
  providerId: string;
  authorUserId: string;
  status: ReviewStatus | string;
  rating: number;
  review: string;
  createdAt: string | null;
  providerSnapshot: {
    displayName: string | null;
  };
  authorSnapshot: {
    displayName: string | null;
  };
  serviceSnapshot: {
    serviceName: string | null;
  };
  user: {
    displayName: string | null;
    email: string | null;
  } | null;
  provider: {
    displayName: string | null;
    email: string | null;
  } | null;
  adminModeration: {
    note: string | null;
  };
};

type ReviewsResponse = {
  items: ReviewAdminListItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    truncated?: boolean;
  };
};

const statuses: ReviewStatus[] = ["published", "hidden_by_admin", "deleted_by_admin"];

const statusLabels: Record<string, string> = {
  published: "Publicată",
  hidden_by_admin: "Ascunsă de admin",
  deleted_by_admin: "Ștearsă de admin",
};

type ReviewFilterDraft = {
  status: string;
  providerId: string;
  userId: string;
  ratingMin: string;
  ratingMax: string;
  dateFrom: string;
  dateTo: string;
};

const defaultFilters: ReviewFilterDraft = {
  status: "all",
  providerId: "",
  userId: "",
  ratingMin: "all",
  ratingMax: "all",
  dateFrom: "",
  dateTo: "",
};

function badgeVariant(status?: string | null) {
  if (status === "published") return "success";
  if (status === "hidden_by_admin") return "warning";
  if (status === "deleted_by_admin") return "danger";
  return "outline";
}

function label(value?: string | null) {
  return value ? statusLabels[value] || value.replaceAll("_", " ") : "-";
}

function toRatingOptions() {
  const values = Array.from({ length: 5 }, (_, index) => String(index + 1));
  return ["all", ...values];
}

function countActiveFilters(filters: ReviewFilterDraft) {
  return [
    filters.status !== defaultFilters.status,
    Boolean(filters.providerId.trim()),
    Boolean(filters.userId.trim()),
    filters.ratingMin !== defaultFilters.ratingMin,
    filters.ratingMax !== defaultFilters.ratingMax,
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
  ].filter(Boolean).length;
}

export default function AdminReviewsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [providerId, setProviderId] = useState("");
  const [userId, setUserId] = useState("");
  const [ratingMin, setRatingMin] = useState("all");
  const [ratingMax, setRatingMax] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<ReviewAdminListItem | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkActionSummary, setBulkActionSummary] = useState<string | null>(null);
  const [bulkActionHasFailures, setBulkActionHasFailures] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<ReviewFilterDraft>(defaultFilters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (status !== "all") params.set("status", status);
    if (providerId.trim()) params.set("providerId", providerId.trim());
    if (userId.trim()) params.set("userId", userId.trim());
    if (ratingMin !== "all") params.set("ratingMin", ratingMin);
    if (ratingMax !== "all") params.set("ratingMax", ratingMax);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params;
  }, [
    dateFrom,
    dateTo,
    debouncedQ,
    page,
    providerId,
    ratingMax,
    ratingMin,
    status,
    userId,
  ]);

  const endpoint = useMemo(
    () => `/api/admin/reviews?${searchParams.toString()}`,
    [searchParams]
  );
  const exportHref = useMemo(
    () => `/api/admin/reviews/export?${searchParams.toString()}`,
    [searchParams]
  );

  const { data, loading, error, reload } = useAdminData<ReviewsResponse>(endpoint);
  const items = useMemo(() => data?.items || [], [data?.items]);
  const pagination = data?.pagination;
  const truncated = Boolean(data?.meta?.truncated);
  const activeFilterCount = useMemo(
    () => countActiveFilters({ status, providerId, userId, ratingMin, ratingMax, dateFrom, dateTo }),
    [dateFrom, dateTo, providerId, ratingMax, ratingMin, status, userId]
  );
  const pageIds = useMemo(
    () => items.map((item) => item.reviewId).filter(Boolean),
    [items]
  );
  const {
    selectedIds,
    selectedCount,
    allSelected,
    toggleSelectAll,
    toggleRow,
    clearSelection,
    setSelectedIds,
  } = useAdminBulkSelection(pageIds, [endpoint]);

  useEffect(() => {
    setNoteDrafts((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (!(item.reviewId in next)) {
          next[item.reviewId] = item.adminModeration?.note || "";
        }
      });
      return next;
    });
  }, [items]);

  async function submitModeration(
    reviewId: string,
    payload: { status?: ReviewStatus; note?: string }
  ) {
    setPendingId(reviewId);
    setActionError(null);
    try {
      const response = await adminFetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza review-ul."));
      }
      await reload();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza review-ul.");
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function deleteReviewHard(reviewId: string) {
    const response = await adminFetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(await readAdminResponseError(response, "Nu am putut șterge review-ul."));
    }
  }

  async function confirmDeleteReview() {
    if (!deleteTarget) {
      return false;
    }

    setPendingId(deleteTarget.reviewId);
    setActionError(null);
    setBulkActionSummary(null);
    try {
      await deleteReviewHard(deleteTarget.reviewId);
      await reload();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut șterge review-ul.");
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function confirmBulkDeleteReviews() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return false;
    }

    setPendingBulkDelete(true);
    setActionError(null);
    setBulkActionSummary(null);
    setBulkActionHasFailures(false);

    try {
      const result = await runAdminBulkDelete(ids, async (reviewId) => {
        const response = await adminFetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          return {
            ok: false as const,
            message: await readAdminResponseError(response, "Nu am putut șterge review-ul."),
          };
        }
        return { ok: true as const };
      });

      const successCount = result.successIds.length;
      const failureCount = result.failures.length;
      if (failureCount > 0) {
        setBulkActionHasFailures(true);
        setBulkActionSummary(`Ștergere parțială: ${successCount} șterse, ${failureCount} eșuate.`);
        setActionError(`ID-uri eșuate: ${result.failures.map((item) => item.id).join(", ")}`);
        setSelectedIds(new Set(result.failures.map((item) => item.id)));
      } else {
        setBulkActionSummary(`${successCount} recenzii au fost șterse.`);
        clearSelection();
      }

      await reload();
      setBulkDeleteConfirmOpen(false);
      return true;
    } finally {
      setPendingBulkDelete(false);
    }
  }

  const ratingOptions = useMemo(() => toRatingOptions(), []);

  function openFilterDialog() {
    setFilterDraft({ status, providerId, userId, ratingMin, ratingMax, dateFrom, dateTo });
    setFilterDialogOpen(true);
  }

  function applyFilterDialog() {
    setPage(1);
    setStatus(filterDraft.status);
    setProviderId(filterDraft.providerId);
    setUserId(filterDraft.userId);
    setRatingMin(filterDraft.ratingMin);
    setRatingMax(filterDraft.ratingMax);
    setDateFrom(filterDraft.dateFrom);
    setDateTo(filterDraft.dateTo);
    setFilterDialogOpen(false);
  }

  function resetFilters() {
    setPage(1);
    setStatus(defaultFilters.status);
    setProviderId(defaultFilters.providerId);
    setUserId(defaultFilters.userId);
    setRatingMin(defaultFilters.ratingMin);
    setRatingMax(defaultFilters.ratingMax);
    setDateFrom(defaultFilters.dateFrom);
    setDateTo(defaultFilters.dateTo);
    setFilterDraft(defaultFilters);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recenzii</h1>
        <p className="text-sm text-muted-foreground">
          Moderare review-uri din aplicația mobilă și investigații operaționale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Căutare și filtre</CardTitle>
              <CardDescription>Caută rapid sau deschide dialogul pentru status, rating, dată, user și provider.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={openFilterDialog}>
                <Filter className="mr-2 h-4 w-4" />
                Filtre
                {activeFilterCount ? (
                  <Badge className="ml-2" variant="secondary">{activeFilterCount}</Badge>
                ) : null}
              </Button>
              {activeFilterCount ? (
                <Button type="button" variant="ghost" onClick={resetFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Resetează
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Căutare"
              value={q}
              disabled={loading}
              onChange={(event) => {
                setPage(1);
                setQ(event.target.value);
              }}
            />
          </div>
          {activeFilterCount ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {status !== "all" ? <Badge variant={badgeVariant(status)}>Status: {label(status)}</Badge> : null}
              {providerId ? <Badge variant="outline">Provider selectat</Badge> : null}
              {userId ? <Badge variant="outline">User selectat</Badge> : null}
              {ratingMin !== "all" ? <Badge variant="outline">Rating min: {ratingMin}</Badge> : null}
              {ratingMax !== "all" ? <Badge variant="outline">Rating max: {ratingMax}</Badge> : null}
              {dateFrom ? <Badge variant="outline">De la: {dateFrom}</Badge> : null}
              {dateTo ? <Badge variant="outline">Până la: {dateTo}</Badge> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista recenzii</CardTitle>
              <CardDescription>
                {pagination?.total || items.length} rezultate
                {truncated ? " (limitate la primele 5000 pentru interogare)" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={loading || selectedCount === 0 || pendingBulkDelete}
                onClick={() => setBulkDeleteConfirmOpen(true)}
              >
                Șterge selecția
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={exportHref}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
          {bulkActionSummary ? (
            <p className={`mb-3 text-sm ${bulkActionHasFailures ? "text-amber-700" : "text-emerald-700"}`}>
              {bulkActionSummary}
            </p>
          ) : null}
          {actionError && <p className="mb-3 text-sm text-rose-500">{actionError}</p>}

          {loading ? (
            <AdminTableSkeleton rows={10} columns={10} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={allSelected}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Creat la</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Serviciu</TableHead>
                  <TableHead>Moderare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const note = noteDrafts[item.reviewId] ?? "";
                  const isPending = pendingId === item.reviewId;
                  const isDeleted = item.status === "deleted_by_admin";
                  return (
                    <TableRow key={item.reviewId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.reviewId)}
                          onChange={(event) => toggleRow(item.reviewId, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.reviewId}</div>
                        <Link
                          className="text-xs text-muted-foreground underline underline-offset-2"
                          href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}
                        >
                          {item.bookingId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(item.status)}>{label(item.status)}</Badge>
                      </TableCell>
                      <TableCell>{item.rating || "-"}</TableCell>
                      <TableCell className="max-w-[280px] align-top">
                        <p className="line-clamp-4 whitespace-pre-wrap text-sm">{item.review || "-"}</p>
                      </TableCell>
                      <TableCell>{formatAdminDateTime(item.createdAt, { includeSeconds: true })}</TableCell>
                      <TableCell>
                        <Link
                          className="underline underline-offset-2"
                          href={`/admin/prestatori/${encodeURIComponent(item.providerId)}`}
                        >
                          {humanProviderLabel({
                            displayName: item.provider?.displayName || item.providerSnapshot?.displayName,
                            email: item.provider?.email,
                          })}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          className="underline underline-offset-2"
                          href={`/admin/utilizatori/${encodeURIComponent(item.authorUserId)}`}
                        >
                          {humanUserLabel({
                            displayName: item.user?.displayName || item.authorSnapshot?.displayName,
                            email: item.user?.email,
                          })}
                        </Link>
                      </TableCell>
                      <TableCell>{item.serviceSnapshot?.serviceName || "-"}</TableCell>
                      <TableCell className="min-w-[280px]">
                        <div className="space-y-2">
                          <Input
                            value={note}
                            placeholder="Notă internă"
                            disabled={isPending}
                            onChange={(event) =>
                              setNoteDrafts((current) => ({
                                ...current,
                                [item.reviewId]: event.target.value,
                              }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            {!isDeleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending || item.status === "hidden_by_admin"}
                                onClick={() =>
                                  void submitModeration(item.reviewId, {
                                    status: "hidden_by_admin",
                                    note,
                                  })
                                }
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Hide
                              </Button>
                            )}
                            {!isDeleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending || item.status === "published"}
                                onClick={() =>
                                  void submitModeration(item.reviewId, {
                                    status: "published",
                                    note,
                                  })
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Re-publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                void submitModeration(item.reviewId, { note })
                              }
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Salvează nota
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isPending || pendingBulkDelete}
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Șterge
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                      Nu există recenzii pentru filtrele selectate.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Pagina {pagination.page} din {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Înapoi
                </Button>
                <Button
                  variant="outline"
                  disabled={loading || page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Înainte
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && pendingId !== deleteTarget?.reviewId) {
            setDeleteTarget(null);
          }
        }}
        title="Ștergi recenzia?"
        description={
          <div className="space-y-3">
            <p>
              Acțiunea este ireversibilă și șterge documentul review din Firestore.
            </p>
            {deleteTarget && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{deleteTarget.reviewId}</div>
                <div>Booking: {deleteTarget.bookingId}</div>
                <div className="mt-2 line-clamp-3 whitespace-pre-wrap">
                  {deleteTarget.review || "Fără text"}
                </div>
              </div>
            )}
          </div>
        }
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={!deleteTarget}
        onConfirm={confirmDeleteReview}
      />
      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!pendingBulkDelete) {
            setBulkDeleteConfirmOpen(open);
          }
        }}
        title="Ștergi recenziile selectate?"
        description={`Vor fi șterse ${selectedCount} elemente selectate.`}
        confirmLabel="Șterge selecția"
        variant="destructive"
        confirmDisabled={selectedCount === 0}
        onConfirm={confirmBulkDeleteReviews}
      />
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtrează recenziile</DialogTitle>
            <DialogDescription>
              Include rapid recenziile șterse, ascunse, publicate sau filtrează după utilizator, provider, rating și dată.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Status</span>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filterDraft.status}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="all">Toate statusurile</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2 text-sm">
              <span className="font-medium">Provider</span>
              <AdminEntityLookup
                value={filterDraft.providerId}
                entityType="provider"
                placeholder="Alege provider"
                onValueChange={(nextValue) =>
                  setFilterDraft((current) => ({ ...current, providerId: nextValue }))
                }
              />
            </div>
            <div className="space-y-2 text-sm">
              <span className="font-medium">User</span>
              <AdminEntityLookup
                value={filterDraft.userId}
                entityType="user"
                placeholder="Alege user"
                onValueChange={(nextValue) =>
                  setFilterDraft((current) => ({ ...current, userId: nextValue }))
                }
              />
            </div>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Rating minim</span>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filterDraft.ratingMin}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, ratingMin: event.target.value }))
                }
              >
                {ratingOptions.map((item) => (
                  <option key={`dialog-min-${item}`} value={item}>
                    {item === "all" ? "Orice rating minim" : `${item}+`}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Rating maxim</span>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filterDraft.ratingMax}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, ratingMax: event.target.value }))
                }
              >
                {ratingOptions.map((item) => (
                  <option key={`dialog-max-${item}`} value={item}>
                    {item === "all" ? "Orice rating maxim" : `${item} sau mai puțin`}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Creat de la</span>
              <Input
                type="date"
                value={filterDraft.dateFrom}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, dateFrom: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Creat până la</span>
              <Input
                type="date"
                value={filterDraft.dateTo}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, dateTo: event.target.value }))
                }
              />
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={resetFilters}>
              Resetează filtrele
            </Button>
            <Button type="button" variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Anulează
            </Button>
            <Button type="button" onClick={applyFilterDialog}>
              Aplică filtre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

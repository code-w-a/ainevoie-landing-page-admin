"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, EyeOff, Search, Save } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReviewStatus = "published" | "hidden_by_admin";

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

const statuses = ["published", "hidden_by_admin"];

function badgeVariant(status?: string | null) {
  if (status === "published") return "success";
  if (status === "hidden_by_admin") return "warning";
  return "outline";
}

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function toRatingOptions() {
  const values = Array.from({ length: 5 }, (_, index) => String(index + 1));
  return ["all", ...values];
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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza review-ul.");
    } finally {
      setPendingId(null);
    }
  }

  const ratingOptions = useMemo(() => toRatingOptions(), []);

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
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Caută după review, user, provider, booking sau serviciu.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
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
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={status}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="all">Toate statusurile</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
          <AdminEntityLookup
            value={providerId}
            entityType="provider"
            disabled={loading}
            placeholder="Provider"
            onValueChange={(nextValue) => {
              setPage(1);
              setProviderId(nextValue);
            }}
          />
          <AdminEntityLookup
            value={userId}
            entityType="user"
            disabled={loading}
            placeholder="User"
            onValueChange={(nextValue) => {
              setPage(1);
              setUserId(nextValue);
            }}
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={ratingMin}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setRatingMin(event.target.value);
            }}
          >
            {ratingOptions.map((item) => (
              <option key={`min-${item}`} value={item}>
                {item === "all" ? "Rating minim" : `${item}+`}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={ratingMax}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setRatingMax(event.target.value);
            }}
          >
            {ratingOptions.map((item) => (
              <option key={`max-${item}`} value={item}>
                {item === "all" ? "Rating maxim" : `${item} sau mai puțin`}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setDateFrom(event.target.value);
            }}
          />
          <Input
            type="date"
            value={dateTo}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setDateTo(event.target.value);
            }}
          />
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
            <Button asChild size="sm" variant="outline">
              <a href={exportHref}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
          {actionError && <p className="mb-3 text-sm text-rose-500">{actionError}</p>}

          {loading ? (
            <AdminTableSkeleton rows={10} columns={9} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                  return (
                    <TableRow key={item.reviewId}>
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
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
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
    </div>
  );
}

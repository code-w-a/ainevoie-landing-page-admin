"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { runAdminBulkDelete, useAdminBulkSelection } from "@/components/admin/useAdminBulkSelection";
import { useAdminData } from "@/components/admin/useAdminData";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BookingListItem = {
  bookingId: string;
  status?: string;
  userId?: string;
  providerId?: string;
  serviceId?: string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  requestDetails?: {
    estimatedHours?: number;
    professionalsCount?: number;
    description?: string;
  };
  requestResponse?: {
    status?: string;
    deadlineAt?: string | null;
    answeredAt?: string | null;
    expiredAt?: string | null;
  };
  pricingSnapshot?: {
    ratePerHourPerProfessional?: number;
    estimatedHours?: number;
    professionalsCount?: number;
  };
  paymentSummary?: {
    status?: string;
    method?: string;
    processor?: string;
    amount?: number;
    currency?: string;
    estimatedHours?: number;
    professionalsCount?: number;
    ratePerHourPerProfessional?: number;
    transactionId?: string | null;
    stripePaymentIntentId?: string | null;
  };
  userSnapshot?: {
    displayName?: string;
  };
  providerSnapshot?: {
    displayName?: string;
  };
  serviceSnapshot?: {
    name?: string;
  };
  updatedAt?: string | null;
};

type BookingsResponse = {
  items: BookingListItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const EMPTY_BOOKINGS: BookingListItem[] = [];

const bookingStatuses = [
  "draft_payment",
  "requested",
  "confirmation_pending",
  "confirmed",
  "payment_expired",
  "reschedule_proposed",
  "completed",
  "rejected",
  "expired_unanswered",
  "cancelled_by_user",
  "cancelled_by_provider",
  "cancelled_by_admin",
];

const paymentStatuses = [
  "unpaid",
  "authorizing",
  "authorized",
  "capturing",
  "paid",
  "failed",
  "released",
  "capture_failed",
];

function badgeVariant(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "confirmed") return "success";
  if (status === "failed" || status === "capture_failed" || status === "rejected" || status === "expired_unanswered" || status?.startsWith("cancelled")) return "danger";
  if (status === "draft_payment" || status === "confirmation_pending" || status === "requested" || status === "reschedule_proposed" || status === "in_progress" || status === "authorizing" || status === "authorized" || status === "capturing") return "warning";
  return "outline";
}

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function getOperationalStatusLabel(item: BookingListItem) {
  const paymentStatus = item.paymentSummary?.status;
  if (item.status === "confirmed" && (paymentStatus === "unpaid" || paymentStatus === "failed")) {
    return "Confirmată, în așteptarea plății";
  }
  return null;
}

function formatAmount(item: BookingListItem) {
  const amount = Number(item.paymentSummary?.amount);
  const currency = item.paymentSummary?.currency || "RON";

  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }

  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatPricingContext(item: BookingListItem) {
  const paymentAmount = Number(item.paymentSummary?.amount);
  const rate = Number(
    item.pricingSnapshot?.ratePerHourPerProfessional
    ?? item.paymentSummary?.ratePerHourPerProfessional
    ?? 0
  );
  const hours = Math.max(
    1,
    Number(
      item.requestDetails?.estimatedHours
      ?? item.pricingSnapshot?.estimatedHours
      ?? item.paymentSummary?.estimatedHours
      ?? 1
    ) || 1
  );
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return `${hours}h`;
  }

  return `${hours}h × ${rate} RON`;
}

function formatRequestResponseMeta(item: BookingListItem) {
  const status = item.requestResponse?.status;
  const deadlineAt = item.requestResponse?.deadlineAt;
  if (status === "pending" && deadlineAt) {
    return `Răspuns până la ${formatAdminDateTime(deadlineAt)}`;
  }
  if (status === "answered" && item.requestResponse?.answeredAt) {
    return `Răspuns înregistrat ${formatAdminDateTime(item.requestResponse.answeredAt)}`;
  }
  if (status === "expired" && item.requestResponse?.expiredAt) {
    return `Expirată ${formatAdminDateTime(item.requestResponse.expiredAt)}`;
  }
  return null;
}

export default function AdminBookingsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [authorizationExpiringOnly, setAuthorizationExpiringOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTargetBookingId, setDeleteTargetBookingId] = useState<string | null>(null);
  const [pendingDeleteBookingId, setPendingDeleteBookingId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkActionSummary, setBulkActionSummary] = useState<string | null>(null);
  const [bulkActionHasFailures, setBulkActionHasFailures] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    if (authorizationExpiringOnly) params.set("authorizationExpiringOnly", "true");
    return `/api/admin/bookings?${params.toString()}`;
  }, [authorizationExpiringOnly, debouncedQ, page, paymentStatus, status]);

  const { data, loading, error, reload } = useAdminData<BookingsResponse>(endpoint);
  const items = data?.items ?? EMPTY_BOOKINGS;
  const pagination = data?.pagination;
  const pageIds = useMemo(
    () => items.map((item) => item.bookingId).filter(Boolean),
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

  async function handleDeleteBookingConfirmed() {
    if (!deleteTargetBookingId) {
      return false;
    }

    setPendingDeleteBookingId(deleteTargetBookingId);
    setActionError(null);

    try {
      const response = await adminFetch(`/api/admin/bookings/${encodeURIComponent(deleteTargetBookingId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut șterge programarea."));
      }

      setDeleteTargetBookingId(null);
      await reload();
      return true;
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut șterge programarea.");
      return false;
    } finally {
      setPendingDeleteBookingId(null);
    }
  }

  async function handleBulkDeleteConfirmed() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return false;
    }

    setPendingBulkDelete(true);
    setActionError(null);
    setBulkActionSummary(null);
    setBulkActionHasFailures(false);

    try {
      const result = await runAdminBulkDelete(ids, async (bookingId) => {
        const response = await adminFetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          return {
            ok: false as const,
            message: await readAdminResponseError(response, "Nu am putut șterge programarea."),
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
        setBulkActionSummary(`${successCount} programări au fost șterse.`);
        clearSelection();
      }

      await reload();
      setBulkDeleteConfirmOpen(false);
      return true;
    } finally {
      setPendingBulkDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Programări</h1>
        <p className="text-sm text-muted-foreground">
          Monitorizare operațională pentru booking-uri și plăți.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Caută după client, prestator, serviciu sau ID.</CardDescription>
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
            <option value="all">Toate programările</option>
            {bookingStatuses.map((item) => (
              <option key={item} value={item}>{label(item)}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={paymentStatus}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setPaymentStatus(event.target.value);
            }}
          >
            <option value="all">Toate plățile</option>
            {paymentStatuses.map((item) => (
              <option key={item} value={item}>{label(item)}</option>
            ))}
          </select>
          <label className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm md:col-span-4">
            <input
              type="checkbox"
              checked={authorizationExpiringOnly}
              disabled={loading}
              onChange={(event) => {
                setPage(1);
                setAuthorizationExpiringOnly(event.target.checked);
              }}
            />
            Autorizații care expiră în următoarele 24 de ore
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista programări</CardTitle>
              <CardDescription>{pagination?.total || items.length} rezultate</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={loading || selectedCount === 0 || pendingBulkDelete}
              onClick={() => setBulkDeleteConfirmOpen(true)}
            >
              Șterge selecția
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          {bulkActionSummary ? (
            <p className={`mb-4 text-sm ${bulkActionHasFailures ? "text-amber-700" : "text-emerald-700"}`}>
              {bulkActionSummary}
            </p>
          ) : null}
          {actionError && <p className="mb-4 text-sm text-rose-500">{actionError}</p>}
          {loading ? (
            <AdminTableSkeleton rows={10} columns={8} />
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
                  <TableHead>Programare</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Prestator</TableHead>
                  <TableHead>Serviciu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const requestResponseMeta = formatRequestResponseMeta(item);
                  const operationalStatus = getOperationalStatusLabel(item);

                  return (
                    <TableRow key={item.bookingId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.bookingId)}
                          onChange={(event) => toggleRow(item.bookingId, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formatAdminDateTime(item.scheduledStartAt)}</p>
                            <p className="text-xs text-muted-foreground">{item.bookingId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {humanUserLabel({
                          displayName: item.userSnapshot?.displayName,
                        })}
                      </TableCell>
                      <TableCell>
                        {humanProviderLabel({
                          displayName: item.providerSnapshot?.displayName,
                        })}
                      </TableCell>
                      <TableCell>{item.serviceSnapshot?.name || item.serviceId || "-"}</TableCell>
                      <TableCell>
                        <div className="mb-1 text-xs text-muted-foreground">
                          {formatPricingContext(item)}
                        </div>
                        {requestResponseMeta ? (
                          <div className="mb-1 text-xs text-muted-foreground">
                            {requestResponseMeta}
                          </div>
                        ) : null}
                        {operationalStatus ? (
                          <div className="mb-1 text-xs font-medium text-amber-700">
                            {operationalStatus}
                          </div>
                        ) : null}
                        <Badge variant={badgeVariant(item.status)}>{label(item.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={badgeVariant(item.paymentSummary?.status)}>
                            {label(item.paymentSummary?.status)}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{formatAmount(item)}</p>
                          <p className="text-xs text-muted-foreground">{label(item.paymentSummary?.processor)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              disabled={Boolean(pendingDeleteBookingId) || pendingBulkDelete}
                              aria-label="Acțiuni programare"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}>
                                Vezi programare
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              disabled={Boolean(pendingDeleteBookingId)}
                              onSelect={() => setDeleteTargetBookingId(item.bookingId)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Șterge programare
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nu există programări pentru filtrele selectate.
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
        open={Boolean(deleteTargetBookingId)}
        onOpenChange={(open) => {
          if (!open && !pendingDeleteBookingId) {
            setDeleteTargetBookingId(null);
          }
        }}
        title="Ștergi această programare?"
        description={
          <div className="space-y-2">
            <p>Acțiunea este ireversibilă și șterge booking-ul din Firestore.</p>
            {deleteTargetBookingId ? (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{deleteTargetBookingId}</div>
              </div>
            ) : null}
          </div>
        }
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={!deleteTargetBookingId}
        onConfirm={handleDeleteBookingConfirmed}
      />
      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!pendingBulkDelete) {
            setBulkDeleteConfirmOpen(open);
          }
        }}
        title="Ștergi programările selectate?"
        description={`Vor fi șterse ${selectedCount} elemente selectate.`}
        confirmLabel="Șterge selecția"
        variant="destructive"
        confirmDisabled={selectedCount === 0}
        onConfirm={handleBulkDeleteConfirmed}
      />
    </div>
  );
}

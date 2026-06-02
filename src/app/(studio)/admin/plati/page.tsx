"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { runAdminBulkDelete, useAdminBulkSelection } from "@/components/admin/useAdminBulkSelection";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanBookingLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
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

type PaymentWebhookState = "ok" | "delayed" | "missing";

type PaymentAdminListItem = {
  paymentId: string;
  bookingId: string | null;
  userId: string | null;
  providerId: string | null;
  status: string;
  createdAt: string | null;
  amount: number;
  grossAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  providerNetAmount: number;
  providerPayoutStatus: string;
  providerPayoutRequestedAt: string | null;
  providerPayoutPaidAt: string | null;
  currency: string;
  processor: string;
  method: string;
  transactionId: string | null;
  stripePaymentIntentId: string | null;
  stripeLatestChargeId: string | null;
  webhookState: PaymentWebhookState;
  booking: {
    bookingId?: string | null;
    status: string | null;
    serviceName?: string | null;
    userName?: string | null;
    providerName?: string | null;
  };
  user: {
    displayName: string | null;
    email: string | null;
  };
  provider: {
    displayName: string | null;
    email: string | null;
  };
};

type PaymentsResponse = {
  items: PaymentAdminListItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    truncated?: boolean;
    maxRows?: number;
  };
};

type ProviderPayoutRequestAdminItem = {
  requestId: string;
  providerId: string | null;
  status: string;
  currency: string;
  grossAmount: number;
  platformFeeAmount: number;
  providerNetAmount: number;
  paymentIds: string[];
  requestedAt: string | null;
  paidAt: string | null;
  paidByAdminUid: string | null;
  adminNote: string | null;
  provider: {
    displayName: string | null;
    email: string | null;
  };
};

type ProviderPayoutRequestsResponse = {
  items: ProviderPayoutRequestAdminItem[];
};

const paymentStatuses = ["unpaid", "in_progress", "paid", "failed"];
const payoutStatuses = ["not_available", "available", "requested", "paid"];

function paymentBadgeVariant(status?: string | null) {
  if (status === "paid") return "success";
  if (status === "failed") return "danger";
  if (status === "in_progress") return "warning";
  return "outline";
}

function webhookBadgeVariant(state: PaymentWebhookState) {
  if (state === "missing") return "danger";
  if (state === "delayed") return "warning";
  return "success";
}

function payoutBadgeVariant(status?: string | null) {
  if (status === "paid") return "success";
  if (status === "requested") return "warning";
  if (status === "available") return "success";
  return "outline";
}

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function formatMoneyValue(amount: number, currency = "RON") {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency || "RON",
  }).format(amount);
}

export default function AdminPaymentsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [providerId, setProviderId] = useState("");
  const [userId, setUserId] = useState("");
  const [processorId, setProcessorId] = useState("");
  const [providerPayoutStatus, setProviderPayoutStatus] = useState("all");
  const [payoutRequestStatus, setPayoutRequestStatus] = useState("requested");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PaymentAdminListItem | null>(null);
  const [pendingDeletePaymentId, setPendingDeletePaymentId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkActionSummary, setBulkActionSummary] = useState<string | null>(null);
  const [bulkActionHasFailures, setBulkActionHasFailures] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingMarkPaidRequestId, setPendingMarkPaidRequestId] = useState<string | null>(null);

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
    if (processorId.trim()) params.set("processorId", processorId.trim());
    if (providerPayoutStatus !== "all") params.set("providerPayoutStatus", providerPayoutStatus);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params;
  }, [dateFrom, dateTo, debouncedQ, page, processorId, providerId, providerPayoutStatus, status, userId]);

  const endpoint = useMemo(
    () => `/api/admin/payments?${searchParams.toString()}`,
    [searchParams]
  );
  const exportHref = useMemo(
    () => `/api/admin/payments/export?${searchParams.toString()}`,
    [searchParams]
  );

  const { data, loading, error, reload } = useAdminData<PaymentsResponse>(endpoint);
  const payoutRequestsEndpoint = useMemo(
    () => `/api/admin/provider-payout-requests?status=${encodeURIComponent(payoutRequestStatus)}`,
    [payoutRequestStatus]
  );
  const {
    data: payoutRequestsData,
    loading: payoutRequestsLoading,
    error: payoutRequestsError,
    reload: reloadPayoutRequests,
  } = useAdminData<ProviderPayoutRequestsResponse>(payoutRequestsEndpoint);
  const items = data?.items || [];
  const payoutRequests = payoutRequestsData?.items || [];
  const pagination = data?.pagination;
  const truncated = Boolean(data?.meta?.truncated);
  const pageIds = useMemo(
    () => items.map((item) => item.paymentId).filter(Boolean),
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

  async function handleDeletePaymentConfirmed() {
    if (!deleteTarget?.paymentId) {
      return false;
    }

    setPendingDeletePaymentId(deleteTarget.paymentId);
    setActionError(null);

    try {
      const response = await adminFetch(`/api/admin/payments/${encodeURIComponent(deleteTarget.paymentId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut șterge plata."));
      }

      setDeleteTarget(null);
      await reload();
      return true;
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut șterge plata.");
      return false;
    } finally {
      setPendingDeletePaymentId(null);
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
      const result = await runAdminBulkDelete(ids, async (paymentId) => {
        const response = await adminFetch(`/api/admin/payments/${encodeURIComponent(paymentId)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          return {
            ok: false as const,
            message: await readAdminResponseError(response, "Nu am putut șterge plata."),
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
        setBulkActionSummary(`${successCount} plăți au fost șterse.`);
        clearSelection();
      }

      await reload();
      setBulkDeleteConfirmOpen(false);
      return true;
    } finally {
      setPendingBulkDelete(false);
    }
  }

  async function handleMarkPayoutPaid(requestId: string) {
    setPendingMarkPaidRequestId(requestId);
    setActionError(null);

    try {
      const response = await adminFetch(
        `/api/admin/provider-payout-requests/${encodeURIComponent(requestId)}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNote: "Marcat plătit din Admin Plăți." }),
        }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut marca payout-ul ca plătit."));
      }

      await Promise.all([reload(), reloadPayoutRequests()]);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut marca payout-ul ca plătit.");
    } finally {
      setPendingMarkPaidRequestId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plati</h1>
     
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>
            Caută după persoane, programare, serviciu sau referințe procesator.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cautare"
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
            {paymentStatuses.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
          <Input
            placeholder="Processor ID"
            value={processorId}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setProcessorId(event.target.value);
            }}
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={providerPayoutStatus}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setProviderPayoutStatus(event.target.value);
            }}
          >
            <option value="all">Toate payout-urile</option>
            {payoutStatuses.map((item) => (
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Cereri payout provideri</CardTitle>
              <CardDescription>
                Providerii cer plata manuală din soldul disponibil. Confirmarea marchează plățile ca achitate către provider.
              </CardDescription>
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
              value={payoutRequestStatus}
              disabled={payoutRequestsLoading}
              onChange={(event) => setPayoutRequestStatus(event.target.value)}
            >
              <option value="requested">Requested</option>
              <option value="paid">Paid</option>
              <option value="all">Toate</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {payoutRequestsError && <p className="mb-4 text-sm text-rose-500">{payoutRequestsError}</p>}
          {payoutRequestsLoading ? (
            <AdminTableSkeleton rows={3} columns={7} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitat la</TableHead>
                  <TableHead>Brut</TableHead>
                  <TableHead>Comision</TableHead>
                  <TableHead>Net provider</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.map((request) => (
                  <TableRow key={request.requestId}>
                    <TableCell>
                      <div className="font-medium">{request.requestId}</div>
                      <div className="text-xs text-muted-foreground">
                        {request.paymentIds.length} plăți
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.providerId ? (
                        <Link
                          href={`/admin/prestatori/${encodeURIComponent(request.providerId)}`}
                          className="underline underline-offset-2"
                        >
                          {humanProviderLabel({
                            displayName: request.provider.displayName,
                            email: request.provider.email,
                          })}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payoutBadgeVariant(request.status)}>
                        {label(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatAdminDateTime(request.requestedAt, { includeSeconds: true })}</TableCell>
                    <TableCell>{formatMoneyValue(request.grossAmount, request.currency)}</TableCell>
                    <TableCell>{formatMoneyValue(request.platformFeeAmount, request.currency)}</TableCell>
                    <TableCell>{formatMoneyValue(request.providerNetAmount, request.currency)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={request.status !== "requested" || pendingMarkPaidRequestId === request.requestId}
                        onClick={() => { void handleMarkPayoutPaid(request.requestId); }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!payoutRequests.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nu există cereri payout pentru filtrul selectat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista plati</CardTitle>
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
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          {bulkActionSummary ? (
            <p className={`mb-4 text-sm ${bulkActionHasFailures ? "text-amber-700" : "text-emerald-700"}`}>
              {bulkActionSummary}
            </p>
          ) : null}
          {actionError && <p className="mb-4 text-sm text-rose-500">{actionError}</p>}
          {loading ? (
            <AdminTableSkeleton rows={10} columns={17} />
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
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creat la</TableHead>
                  <TableHead>Brut</TableHead>
                  <TableHead>Comision</TableHead>
                  <TableHead>Net provider</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Procesator</TableHead>
                  <TableHead>Tranzactie</TableHead>
                  <TableHead>Stripe PI</TableHead>
                  <TableHead>Stripe Charge</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.paymentId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.paymentId)}
                        onChange={(event) => toggleRow(item.paymentId, event.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {humanBookingLabel({
                          serviceName: item.booking?.serviceName,
                          userLabel: item.user?.displayName || item.user?.email,
                          providerLabel: item.provider?.displayName || item.provider?.email,
                        }, "Plată")}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.method || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentBadgeVariant(item.status)}>
                        {label(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatAdminDateTime(item.createdAt, { includeSeconds: true })}</TableCell>
                    <TableCell>{formatMoneyValue(item.grossAmount || item.amount, item.currency)}</TableCell>
                    <TableCell>
                      <div>{formatMoneyValue(item.platformFeeAmount, item.currency)}</div>
                      <div className="text-xs text-muted-foreground">{item.platformFeePercent || 0}%</div>
                    </TableCell>
                    <TableCell>{formatMoneyValue(item.providerNetAmount, item.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={payoutBadgeVariant(item.providerPayoutStatus)}>
                        {label(item.providerPayoutStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{label(item.processor)}</TableCell>
                    <TableCell className="max-w-[180px] truncate" title={item.transactionId || "-"}>
                      {item.transactionId || "-"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={item.stripePaymentIntentId || "-"}>
                      {item.stripePaymentIntentId || "-"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={item.stripeLatestChargeId || "-"}>
                      {item.stripeLatestChargeId || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={webhookBadgeVariant(item.webhookState)}>
                        {item.webhookState}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.bookingId ? (
                        <Link
                          href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}
                          className="underline underline-offset-2"
                        >
                          {humanBookingLabel({
                            serviceName: item.booking?.serviceName,
                            userLabel: item.booking?.userName,
                            providerLabel: item.booking?.providerName,
                          })}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.userId ? (
                        <Link
                          href={`/admin/utilizatori/${encodeURIComponent(item.userId)}`}
                          className="underline underline-offset-2"
                        >
                          {humanUserLabel({
                            displayName: item.user.displayName,
                            email: item.user.email,
                          })}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.providerId ? (
                        <Link
                          href={`/admin/prestatori/${encodeURIComponent(item.providerId)}`}
                          className="underline underline-offset-2"
                        >
                          {humanProviderLabel({
                            displayName: item.provider.displayName,
                            email: item.provider.email,
                          })}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={Boolean(pendingDeletePaymentId) || pendingBulkDelete}
                            aria-label="Acțiuni plată"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            asChild
                            disabled={!item.bookingId}
                          >
                            {item.bookingId ? (
                              <Link href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}>
                                Detalii booking
                              </Link>
                            ) : (
                              <span>Detalii booking</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            disabled={Boolean(pendingDeletePaymentId)}
                            onSelect={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge plată
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={17} className="py-8 text-center text-sm text-muted-foreground">
                      Nu exista plati pentru filtrele selectate.
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
                  Inapoi
                </Button>
                <Button
                  variant="outline"
                  disabled={loading || page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Inainte
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !pendingDeletePaymentId) {
            setDeleteTarget(null);
          }
        }}
        title="Ștergi această plată?"
        description={
          <div className="space-y-2">
            <p>Acțiunea este ireversibilă și va șterge documentul de plată din Firestore.</p>
            {deleteTarget ? (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{deleteTarget.paymentId}</div>
                <div>Booking: {deleteTarget.bookingId || "-"}</div>
                <div>Status: {label(deleteTarget.status)}</div>
              </div>
            ) : null}
          </div>
        }
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={!deleteTarget}
        onConfirm={handleDeletePaymentConfirmed}
      />
      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!pendingBulkDelete) {
            setBulkDeleteConfirmOpen(open);
          }
        }}
        title="Ștergi plățile selectate?"
        description={`Vor fi șterse ${selectedCount} elemente selectate.`}
        confirmLabel="Șterge selecția"
        variant="destructive"
        confirmDisabled={selectedCount === 0}
        onConfirm={handleBulkDeleteConfirmed}
      />
    </div>
  );
}

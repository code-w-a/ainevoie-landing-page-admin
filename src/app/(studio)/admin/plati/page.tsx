"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Download, Search } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanBookingLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
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

type PaymentWebhookState = "ok" | "delayed" | "missing";

type PaymentAdminListItem = {
  paymentId: string;
  bookingId: string | null;
  userId: string | null;
  providerId: string | null;
  status: string;
  createdAt: string | null;
  amount: number;
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

const paymentStatuses = ["unpaid", "in_progress", "paid", "failed"];

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

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function formatAmount(item: PaymentAdminListItem) {
  if (!Number.isFinite(item.amount) || item.amount <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: item.currency || "RON",
  }).format(item.amount);
}

export default function AdminPaymentsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [providerId, setProviderId] = useState("");
  const [userId, setUserId] = useState("");
  const [processorId, setProcessorId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

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
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params;
  }, [dateFrom, dateTo, debouncedQ, page, processorId, providerId, status, userId]);

  const endpoint = useMemo(
    () => `/api/admin/payments?${searchParams.toString()}`,
    [searchParams]
  );
  const exportHref = useMemo(
    () => `/api/admin/payments/export?${searchParams.toString()}`,
    [searchParams]
  );

  const { data, loading, error } = useAdminData<PaymentsResponse>(endpoint);
  const items = data?.items || [];
  const pagination = data?.pagination;
  const truncated = Boolean(data?.meta?.truncated);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plati</h1>
        <p className="text-sm text-muted-foreground">
          Monitorizare plati, referinte Stripe si reconciliere webhook.
        </p>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista plati</CardTitle>
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
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          {loading ? (
            <AdminTableSkeleton rows={10} columns={12} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creat la</TableHead>
                  <TableHead>Suma</TableHead>
                  <TableHead>Procesator</TableHead>
                  <TableHead>Tranzactie</TableHead>
                  <TableHead>Stripe PI</TableHead>
                  <TableHead>Stripe Charge</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.paymentId}>
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
                    <TableCell>{formatAmount(item)}</TableCell>
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
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {humanBookingLabel({
                              serviceName: item.booking?.serviceName,
                              userLabel: item.booking?.userName,
                              providerLabel: item.booking?.providerName,
                            })}
                          </Link>
                        </Button>
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
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
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
    </div>
  );
}

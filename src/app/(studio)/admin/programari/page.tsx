"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Search } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
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

type BookingListItem = {
  bookingId: string;
  status?: string;
  userId?: string;
  providerId?: string;
  serviceId?: string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  paymentSummary?: {
    status?: string;
    method?: string;
    processor?: string;
    amount?: number;
    currency?: string;
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

const bookingStatuses = [
  "requested",
  "confirmed",
  "reschedule_proposed",
  "completed",
  "rejected",
  "cancelled_by_user",
  "cancelled_by_provider",
];

const paymentStatuses = ["unpaid", "in_progress", "paid", "failed"];

function badgeVariant(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "confirmed") return "success";
  if (status === "failed" || status === "rejected" || status?.startsWith("cancelled")) return "danger";
  if (status === "requested" || status === "reschedule_proposed" || status === "in_progress") return "warning";
  return "outline";
}

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
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

export default function AdminBookingsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);

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
    return `/api/admin/bookings?${params.toString()}`;
  }, [debouncedQ, page, paymentStatus, status]);

  const { data, loading, error } = useAdminData<BookingsResponse>(endpoint);
  const items = data?.items || [];
  const pagination = data?.pagination;

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista programări</CardTitle>
          <CardDescription>{pagination?.total || items.length} rezultate</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          {loading ? (
            <AdminTableSkeleton rows={10} columns={7} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programare</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Prestator</TableHead>
                  <TableHead>Serviciu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead className="text-right">Detalii</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.bookingId}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatAdminDateTime(item.scheduledStartAt)}</p>
                          <p className="text-xs text-muted-foreground">{item.bookingId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.userSnapshot?.displayName || item.userId || "-"}</TableCell>
                    <TableCell>{item.providerSnapshot?.displayName || item.providerId || "-"}</TableCell>
                    <TableCell>{item.serviceSnapshot?.name || item.serviceId || "-"}</TableCell>
                    <TableCell>
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
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}>
                          Vezi
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
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
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SubscriptionAdminItem = {
  subscriptionId: string;
  userId: string | null;
  providerId: string | null;
  serviceId: string | null;
  frequency: string;
  status: string;
  timezone: string | null;
  scheduledStartTime: string | null;
  nextScheduledDateKey: string | null;
  occurrenceCount: number;
  firstBookingId: string | null;
  lastBookingId: string | null;
  createdAt: string | null;
};

type SubscriptionsResponse = {
  items: SubscriptionAdminItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

// Pagină ascunsă temporar — rezervări recurente (implementare ulterioară).
// Pune pe `true` + reactivează intrarea din AdminSidebar când funcția e livrată.
const ADMIN_SUBSCRIPTIONS_PAGE_ENABLED = false;

const statuses = ["pending_payment", "active", "paused", "payment_action_required", "cancelled"];
const frequencyLabels: Record<string, string> = {
  weekly: "Săptămânal",
  biweekly: "La 2 săptămâni",
  monthly: "Lunar",
};

function statusBadgeVariant(status?: string | null) {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "pending_payment" || status === "payment_action_required") return "warning";
  if (status === "cancelled") return "danger";
  return "outline";
}

function frequencyLabel(frequency?: string | null) {
  if (!frequency) return "-";
  return frequencyLabels[frequency] || frequency;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (status !== "all") params.set("status", status);
    return params;
  }, [page, status]);

  const endpoint = useMemo(
    () => `/api/admin/subscriptions?${searchParams.toString()}`,
    [searchParams]
  );

  const { data, loading, error, reload } = useAdminData<SubscriptionsResponse>(endpoint);

  useEffect(() => {
    if (!ADMIN_SUBSCRIPTIONS_PAGE_ENABLED) {
      router.replace("/admin/programari");
    }
  }, [router]);

  if (!ADMIN_SUBSCRIPTIONS_PAGE_ENABLED) {
    return null;
  }

  const items = data?.items || [];
  const pagination = data?.pagination;

  async function applyStatus(subscriptionId: string, nextStatus: string) {
    setPendingId(subscriptionId);
    setActionError(null);

    try {
      const response = await adminFetch(
        `/api/admin/subscriptions/${encodeURIComponent(subscriptionId)}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza abonamentul."));
      }

      await reload();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut actualiza abonamentul.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Abonamente</h1>
        <p className="text-sm text-muted-foreground">
          Abonamentele recurente generează automat programări înainte de fiecare dată programată.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Listă abonamente</CardTitle>
              <CardDescription>
                {pagination?.total || items.length} rezultate
              </CardDescription>
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
                  {item}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          {actionError && <p className="mb-4 text-sm text-rose-500">{actionError}</p>}
          {loading ? (
            <AdminTableSkeleton rows={8} columns={8} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Abonament</TableHead>
                  <TableHead>Frecvență</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Următoarea</TableHead>
                  <TableHead>Generate</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.subscriptionId}>
                    <TableCell>
                      <div className="font-medium">{item.subscriptionId}</div>
                      <div className="text-xs text-muted-foreground">
                        Creat: {formatAdminDateTime(item.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>{frequencyLabel(item.frequency)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.nextScheduledDateKey || "-"} · {item.scheduledStartTime || "--:--"}
                    </TableCell>
                    <TableCell>{item.occurrenceCount || 0}</TableCell>
                    <TableCell>
                      {item.userId ? (
                        <Link
                          href={`/admin/utilizatori/${encodeURIComponent(item.userId)}`}
                          className="underline underline-offset-2"
                        >
                          {item.userId}
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
                          {item.providerId}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.status === "active" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pendingId === item.subscriptionId}
                            onClick={() => { void applyStatus(item.subscriptionId, "paused"); }}
                          >
                            Pauză
                          </Button>
                        ) : null}
                        {item.status === "paused" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pendingId === item.subscriptionId}
                            onClick={() => { void applyStatus(item.subscriptionId, "active"); }}
                          >
                            Reactivează
                          </Button>
                        ) : null}
                        {item.status !== "cancelled" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={pendingId === item.subscriptionId}
                            onClick={() => { void applyStatus(item.subscriptionId, "cancelled"); }}
                          >
                            Anulează
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nu există abonamente pentru filtrul selectat.
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

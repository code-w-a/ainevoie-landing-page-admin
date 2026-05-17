"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { runAdminBulkDelete, useAdminBulkSelection } from "@/components/admin/useAdminBulkSelection";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanAdminLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SupportTicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
type SupportTicketTopic = "support" | "bug";

type SupportTicketListItem = {
  ticketId: string;
  topic: SupportTicketTopic | string;
  subject: string;
  initialMessage: string;
  status: SupportTicketStatus | string;
  priority: SupportTicketPriority | string;
  requesterUid: string;
  requesterRole: "user" | "provider" | string;
  requester: {
    uid: string;
    role: string;
    displayName: string | null;
    email: string | null;
  };
  assignedAdminUid: string | null;
  assignedAdminSnapshot: {
    displayName: string | null;
    email: string | null;
    role: string | null;
  } | null;
  adminNote: string | null;
  relatedEntity: {
    bookingId: string | null;
    providerId: string | null;
    userId: string | null;
  } | null;
  relatedBooking?: {
    bookingId: string;
    status: string | null;
    scheduledStartAt: string | null;
  } | null;
  relatedUser?: {
    userId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  relatedProvider?: {
    providerId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  slaAgeMinutes: number;
  updatedAt: string | null;
  createdAt: string | null;
};

type SupportTicketsResponse = {
  items: SupportTicketListItem[];
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

const statuses: SupportTicketStatus[] = ["open", "in_progress", "waiting_user", "resolved", "closed"];
const priorities: SupportTicketPriority[] = ["low", "normal", "high", "urgent"];
const topics: SupportTicketTopic[] = ["support", "bug"];

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function statusVariant(status: string) {
  if (status === "open") return "warning";
  if (status === "in_progress") return "default";
  if (status === "waiting_user") return "outline";
  if (status === "resolved") return "success";
  if (status === "closed") return "secondary";
  return "outline";
}

function priorityVariant(priority: string) {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "normal") return "outline";
  return "secondary";
}

function formatSlaAge(ageMinutes: number) {
  if (!Number.isFinite(ageMinutes) || ageMinutes <= 0) {
    return "0m";
  }
  if (ageMinutes < 60) {
    return `${ageMinutes}m`;
  }
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  if (hours < 24) {
    return `${hours}h ${minutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

function requesterHref(item: SupportTicketListItem) {
  if (item.requesterRole === "provider") {
    return `/admin/prestatori/${encodeURIComponent(item.requesterUid)}`;
  }
  return `/admin/utilizatori/${encodeURIComponent(item.requesterUid)}`;
}

export default function AdminSupportTicketsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [topic, setTopic] = useState("all");
  const [assignedAdminUid, setAssignedAdminUid] = useState("");
  const [requesterUid, setRequesterUid] = useState("");
  const [relatedEntityType, setRelatedEntityType] = useState<"booking" | "provider" | "user">("booking");
  const [relatedEntityId, setRelatedEntityId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteTicketId, setPendingDeleteTicketId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupportTicketListItem | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkActionSummary, setBulkActionSummary] = useState<string | null>(null);
  const [bulkActionHasFailures, setBulkActionHasFailures] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
    if (priority !== "all") params.set("priority", priority);
    if (topic !== "all") params.set("topic", topic);
    if (assignedAdminUid.trim()) params.set("assignedAdminUid", assignedAdminUid.trim());
    if (requesterUid.trim()) params.set("requesterUid", requesterUid.trim());
    if (relatedEntityId.trim()) {
      params.set("relatedEntityType", relatedEntityType);
      params.set("relatedEntityId", relatedEntityId.trim());
    }
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params;
  }, [
    assignedAdminUid,
    dateFrom,
    dateTo,
    debouncedQ,
    page,
    priority,
    relatedEntityId,
    relatedEntityType,
    requesterUid,
    status,
    topic,
  ]);

  const endpoint = useMemo(
    () => `/api/admin/support-tickets?${searchParams.toString()}`,
    [searchParams]
  );

  const { data, loading, error, reload } = useAdminData<SupportTicketsResponse>(endpoint);
  const items = useMemo(() => data?.items || [], [data?.items]);
  const pagination = data?.pagination;
  const truncated = Boolean(data?.meta?.truncated);
  const pageIds = useMemo(
    () => items.map((item) => item.ticketId).filter(Boolean),
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

  async function handleDeleteTicketConfirmed() {
    if (!deleteTarget?.ticketId) {
      return false;
    }

    setPendingDeleteTicketId(deleteTarget.ticketId);
    setActionError(null);

    try {
      const response = await adminFetch(`/api/admin/support-tickets/${encodeURIComponent(deleteTarget.ticketId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut șterge ticket-ul de suport."));
      }

      setDeleteTarget(null);
      await reload();
      return true;
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut șterge ticket-ul de suport.");
      return false;
    } finally {
      setPendingDeleteTicketId(null);
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
      const result = await runAdminBulkDelete(ids, async (ticketId) => {
        const response = await adminFetch(`/api/admin/support-tickets/${encodeURIComponent(ticketId)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          return {
            ok: false as const,
            message: await readAdminResponseError(response, "Nu am putut șterge ticket-ul de suport."),
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
        setBulkActionSummary(`${successCount} tichete au fost șterse.`);
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
        <h1 className="text-2xl font-semibold">Suport</h1>
        <p className="text-sm text-muted-foreground">
          Ticketing operațional pentru suport și bug reports din aplicația mobilă.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Caută după ticket, subiect, requester, assignee sau entități legate.</CardDescription>
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

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={priority}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setPriority(event.target.value);
            }}
          >
            <option value="all">Toate prioritățile</option>
            {priorities.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={topic}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setTopic(event.target.value);
            }}
          >
            <option value="all">Toate topicurile</option>
            {topics.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>

          <AdminEntityLookup
            value={assignedAdminUid}
            entityType="admin"
            disabled={loading}
            placeholder="Assignee admin"
            onValueChange={(nextValue) => {
              setPage(1);
              setAssignedAdminUid(nextValue);
            }}
          />

          <AdminEntityLookup
            value={requesterUid}
            entityType={["user", "provider"]}
            disabled={loading}
            placeholder="Requester (user/provider)"
            onValueChange={(nextValue) => {
              setPage(1);
              setRequesterUid(nextValue);
            }}
          />

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={relatedEntityType}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setRelatedEntityType(event.target.value as "booking" | "provider" | "user");
              setRelatedEntityId("");
            }}
          >
            <option value="booking">Related booking</option>
            <option value="provider">Related provider</option>
            <option value="user">Related user</option>
          </select>

          <AdminEntityLookup
            value={relatedEntityId}
            entityType={relatedEntityType}
            disabled={loading}
            placeholder="Select related entity"
            onValueChange={(nextValue) => {
              setPage(1);
              setRelatedEntityId(nextValue);
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
              <CardTitle>Lista tichete suport</CardTitle>
              <CardDescription>
                {pagination?.total || items.length} rezultate
                {truncated ? " (limitate la primele 5000 pentru interogare)" : ""}
              </CardDescription>
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
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
          {bulkActionSummary ? (
            <p className={`mb-3 text-sm ${bulkActionHasFailures ? "text-amber-700" : "text-emerald-700"}`}>
              {bulkActionSummary}
            </p>
          ) : null}
          {actionError && <p className="mb-3 text-sm text-rose-500">{actionError}</p>}

          {loading ? (
            <AdminTableSkeleton rows={10} columns={11} />
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
                  <TableHead>Ticket</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioritate</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead>SLA age</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.ticketId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.ticketId)}
                        onChange={(event) => toggleRow(item.ticketId, event.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="max-w-[220px] align-top">
                      <p className="font-medium">{item.ticketId}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.subject || "-"}</p>
                      <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                        {item.initialMessage || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{label(item.topic)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)}>{label(item.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(item.priority)}>{label(item.priority)}</Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <Link
                        className="underline underline-offset-2"
                        href={requesterHref(item)}
                      >
                        {item.requesterRole === "provider"
                          ? humanProviderLabel({
                            displayName: item.requester.displayName,
                            email: item.requester.email,
                          })
                          : humanUserLabel({
                            displayName: item.requester.displayName,
                            email: item.requester.email,
                          })}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.requester.role}</p>
                    </TableCell>
                    <TableCell className="align-top">
                      {item.assignedAdminUid ? (
                        <p className="text-sm">
                          {humanAdminLabel({
                            displayName: item.assignedAdminSnapshot?.displayName,
                            email: item.assignedAdminSnapshot?.email,
                          })}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Neasignat</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs">
                        {item.relatedEntity?.bookingId ? (
                          <Link
                            href={`/admin/programari/${encodeURIComponent(item.relatedEntity.bookingId)}`}
                            className="block underline underline-offset-2"
                          >
                            booking: {item.relatedBooking?.status ? label(item.relatedBooking.status) : "Programare"}
                            <span className="ml-1 text-muted-foreground">({item.relatedEntity.bookingId})</span>
                          </Link>
                        ) : null}
                        {item.relatedEntity?.providerId ? (
                          <Link
                            href={`/admin/prestatori/${encodeURIComponent(item.relatedEntity.providerId)}`}
                            className="block underline underline-offset-2"
                          >
                            provider: {humanProviderLabel({
                              displayName: item.relatedProvider?.displayName,
                              email: item.relatedProvider?.email,
                            })}
                            <span className="ml-1 text-muted-foreground">({item.relatedEntity.providerId})</span>
                          </Link>
                        ) : null}
                        {item.relatedEntity?.userId ? (
                          <Link
                            href={`/admin/utilizatori/${encodeURIComponent(item.relatedEntity.userId)}`}
                            className="block underline underline-offset-2"
                          >
                            user: {humanUserLabel({
                              displayName: item.relatedUser?.displayName,
                              email: item.relatedUser?.email,
                            })}
                            <span className="ml-1 text-muted-foreground">({item.relatedEntity.userId})</span>
                          </Link>
                        ) : null}
                        {!item.relatedEntity?.bookingId
                        && !item.relatedEntity?.providerId
                        && !item.relatedEntity?.userId
                          ? <span className="text-muted-foreground">-</span>
                          : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatSlaAge(item.slaAgeMinutes)}</TableCell>
                    <TableCell>{formatAdminDateTime(item.updatedAt || item.createdAt, { includeSeconds: true })}</TableCell>
                    <TableCell className="text-right align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={Boolean(pendingDeleteTicketId) || pendingBulkDelete}
                            aria-label="Acțiuni ticket"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/suport/${encodeURIComponent(item.ticketId)}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Vezi ticket
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            disabled={Boolean(pendingDeleteTicketId)}
                            onSelect={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                      Nu există tichete de suport pentru filtrele selectate.
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
          if (!open && !pendingDeleteTicketId) {
            setDeleteTarget(null);
          }
        }}
        title="Ștergi acest ticket?"
        description={
          <div className="space-y-2">
            <p>Acțiunea este ireversibilă și șterge documentul ticket din Firestore.</p>
            {deleteTarget ? (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{deleteTarget.ticketId}</div>
                <div>Status: {label(deleteTarget.status)}</div>
                <div>Prioritate: {label(deleteTarget.priority)}</div>
              </div>
            ) : null}
          </div>
        }
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={!deleteTarget}
        onConfirm={handleDeleteTicketConfirmed}
      />
      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!pendingBulkDelete) {
            setBulkDeleteConfirmOpen(open);
          }
        }}
        title="Ștergi tichetele selectate?"
        description={`Vor fi șterse ${selectedCount} elemente selectate.`}
        confirmLabel="Șterge selecția"
        variant="destructive"
        confirmDisabled={selectedCount === 0}
        onConfirm={handleBulkDeleteConfirmed}
      />
    </div>
  );
}

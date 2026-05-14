"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
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

type TicketDraft = {
  status: string;
  priority: string;
  assignedAdminUid: string;
  adminNote: string;
  relatedBookingId: string;
  relatedProviderId: string;
  relatedUserId: string;
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
  const [relatedEntity, setRelatedEntity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, TicketDraft>>({});

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
    if (relatedEntity.trim()) params.set("relatedEntity", relatedEntity.trim());
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
    relatedEntity,
    requesterUid,
    status,
    topic,
  ]);

  const endpoint = useMemo(
    () => `/api/admin/support-tickets?${searchParams.toString()}`,
    [searchParams]
  );

  const { data, loading, error, reload } = useAdminData<SupportTicketsResponse>(endpoint);
  const items = data?.items || [];
  const pagination = data?.pagination;
  const truncated = Boolean(data?.meta?.truncated);

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (next[item.ticketId]) {
          return;
        }
        next[item.ticketId] = {
          status: item.status,
          priority: item.priority,
          assignedAdminUid: item.assignedAdminUid || "",
          adminNote: item.adminNote || "",
          relatedBookingId: item.relatedEntity?.bookingId || "",
          relatedProviderId: item.relatedEntity?.providerId || "",
          relatedUserId: item.relatedEntity?.userId || "",
        };
      });
      return next;
    });
  }, [items]);

  async function saveDraft(ticketId: string) {
    const draft = drafts[ticketId];
    if (!draft) {
      return;
    }

    setPendingId(ticketId);
    setActionError(null);
    try {
      const response = await adminFetch(
        `/api/admin/support-tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: draft.status,
            priority: draft.priority,
            assignedAdminUid: draft.assignedAdminUid.trim() || null,
            adminNote: draft.adminNote,
            relatedEntity:
              draft.relatedBookingId.trim()
              || draft.relatedProviderId.trim()
              || draft.relatedUserId.trim()
                ? {
                  bookingId: draft.relatedBookingId.trim() || null,
                  providerId: draft.relatedProviderId.trim() || null,
                  userId: draft.relatedUserId.trim() || null,
                }
                : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza ticket-ul."));
      }

      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza ticket-ul.");
    } finally {
      setPendingId(null);
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

          <Input
            placeholder="Assigned admin UID"
            value={assignedAdminUid}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setAssignedAdminUid(event.target.value);
            }}
          />

          <Input
            placeholder="Requester UID"
            value={requesterUid}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setRequesterUid(event.target.value);
            }}
          />

          <Input
            placeholder="Related entity"
            value={relatedEntity}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setRelatedEntity(event.target.value);
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
          <CardTitle>Lista tichete suport</CardTitle>
          <CardDescription>
            {pagination?.total || items.length} rezultate
            {truncated ? " (limitate la primele 5000 pentru interogare)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
          {actionError && <p className="mb-3 text-sm text-rose-500">{actionError}</p>}

          {loading ? (
            <AdminTableSkeleton rows={10} columns={10} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioritate</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead>SLA age</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const draft = drafts[item.ticketId];
                  const isPending = pendingId === item.ticketId;
                  return (
                    <TableRow key={item.ticketId}>
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
                          {item.requester.displayName || item.requester.email || item.requesterUid}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.requester.role}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        {item.assignedAdminUid ? (
                          <p className="text-sm">
                            {item.assignedAdminSnapshot?.displayName
                            || item.assignedAdminSnapshot?.email
                            || item.assignedAdminUid}
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
                              booking: {item.relatedEntity.bookingId}
                            </Link>
                          ) : null}
                          {item.relatedEntity?.providerId ? (
                            <Link
                              href={`/admin/prestatori/${encodeURIComponent(item.relatedEntity.providerId)}`}
                              className="block underline underline-offset-2"
                            >
                              provider: {item.relatedEntity.providerId}
                            </Link>
                          ) : null}
                          {item.relatedEntity?.userId ? (
                            <Link
                              href={`/admin/utilizatori/${encodeURIComponent(item.relatedEntity.userId)}`}
                              className="block underline underline-offset-2"
                            >
                              user: {item.relatedEntity.userId}
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
                      <TableCell className="min-w-[340px] align-top">
                        {draft ? (
                          <div className="space-y-2">
                            <div className="grid gap-2 md:grid-cols-2">
                              <select
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={draft.status}
                                disabled={isPending}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [item.ticketId]: {
                                      ...current[item.ticketId],
                                      status: event.target.value,
                                    },
                                  }))
                                }
                              >
                                {statuses.map((nextStatus) => (
                                  <option key={nextStatus} value={nextStatus}>
                                    {label(nextStatus)}
                                  </option>
                                ))}
                              </select>

                              <select
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={draft.priority}
                                disabled={isPending}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [item.ticketId]: {
                                      ...current[item.ticketId],
                                      priority: event.target.value,
                                    },
                                  }))
                                }
                              >
                                {priorities.map((nextPriority) => (
                                  <option key={nextPriority} value={nextPriority}>
                                    {label(nextPriority)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <Input
                              value={draft.assignedAdminUid}
                              placeholder="assignedAdminUid"
                              disabled={isPending}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [item.ticketId]: {
                                    ...current[item.ticketId],
                                    assignedAdminUid: event.target.value,
                                  },
                                }))
                              }
                            />

                            <Input
                              value={draft.adminNote}
                              placeholder="Notă internă"
                              disabled={isPending}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [item.ticketId]: {
                                    ...current[item.ticketId],
                                    adminNote: event.target.value,
                                  },
                                }))
                              }
                            />

                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                value={draft.relatedBookingId}
                                placeholder="bookingId"
                                disabled={isPending}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [item.ticketId]: {
                                      ...current[item.ticketId],
                                      relatedBookingId: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <Input
                                value={draft.relatedProviderId}
                                placeholder="providerId"
                                disabled={isPending}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [item.ticketId]: {
                                      ...current[item.ticketId],
                                      relatedProviderId: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <Input
                                value={draft.relatedUserId}
                                placeholder="userId"
                                disabled={isPending}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [item.ticketId]: {
                                      ...current[item.ticketId],
                                      relatedUserId: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>

                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => {
                                void saveDraft(item.ticketId);
                              }}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Salvează
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
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
    </div>
  );
}

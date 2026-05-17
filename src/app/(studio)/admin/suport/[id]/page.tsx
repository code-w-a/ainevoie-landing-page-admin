"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { humanAdminLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
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

type SupportTicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

type SupportTicketItem = {
  ticketId: string;
  topic: string;
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
  resolvedAt: string | null;
  closedAt: string | null;
};

type SupportTicketDetailResponse = {
  item?: SupportTicketItem;
};

type TicketDraft = {
  status: string;
  priority: string;
  assignedAdminUid: string;
  adminNote: string;
  relatedEntityType: "booking" | "provider" | "user";
  relatedEntityId: string;
};

const statuses: SupportTicketStatus[] = ["open", "in_progress", "waiting_user", "resolved", "closed"];
const priorities: SupportTicketPriority[] = ["low", "normal", "high", "urgent"];

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

function detectRelatedEntityType(item?: SupportTicketItem) {
  if (item?.relatedEntity?.providerId) return "provider" as const;
  if (item?.relatedEntity?.userId) return "user" as const;
  return "booking" as const;
}

function infoRow(labelValue: string, value: string) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{labelValue}</p>
      <p className="mt-1 text-sm font-medium break-words">{value || "-"}</p>
    </div>
  );
}

export default function AdminSupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = decodeURIComponent(params.id || "");
  const endpoint = useMemo(
    () => `/api/admin/support-tickets/${encodeURIComponent(ticketId)}`,
    [ticketId]
  );
  const { data, loading, error, reload } = useAdminData<SupportTicketDetailResponse>(endpoint);
  const item = data?.item;

  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [draft, setDraft] = useState<TicketDraft | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }
    setDraft({
      status: item.status,
      priority: item.priority,
      assignedAdminUid: item.assignedAdminUid || "",
      adminNote: item.adminNote || "",
      relatedEntityType: detectRelatedEntityType(item),
      relatedEntityId:
        item.relatedEntity?.bookingId
        || item.relatedEntity?.providerId
        || item.relatedEntity?.userId
        || "",
    });
  }, [item]);

  async function saveTicket() {
    if (!draft || !item?.ticketId) {
      return;
    }

    setPending(true);
    setActionError(null);
    try {
      const response = await adminFetch(`/api/admin/support-tickets/${encodeURIComponent(item.ticketId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          priority: draft.priority,
          assignedAdminUid: draft.assignedAdminUid.trim() || null,
          adminNote: draft.adminNote,
          relatedEntity: draft.relatedEntityId.trim()
            ? {
              bookingId: draft.relatedEntityType === "booking" ? draft.relatedEntityId.trim() : null,
              providerId: draft.relatedEntityType === "provider" ? draft.relatedEntityId.trim() : null,
              userId: draft.relatedEntityType === "user" ? draft.relatedEntityId.trim() : null,
            }
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza ticket-ul."));
      }

      await reload();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut actualiza ticket-ul.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3">
            <Link href="/admin/suport">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la suport
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Detalii ticket suport</h1>
          <p className="text-xs text-muted-foreground">Ticket ID: {ticketId}</p>
        </div>
        {item ? (
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(item.status)}>{label(item.status)}</Badge>
            <Badge variant={priorityVariant(item.priority)}>{label(item.priority)}</Badge>
            <Badge variant="outline">{label(item.topic)}</Badge>
          </div>
        ) : null}
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
      {loading && <p className="text-sm text-muted-foreground">Se încarcă ticket-ul...</p>}

      {!loading && item ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ticket</CardTitle>
                <CardDescription>Detalii principale și SLA.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {infoRow("Subiect", item.subject || "-")}
                {infoRow("Mesaj inițial", item.initialMessage || "-")}
                {infoRow("SLA age", formatSlaAge(item.slaAgeMinutes))}
                {infoRow("Creat", formatAdminDateTime(item.createdAt, { includeSeconds: true }))}
                {infoRow("Actualizat", formatAdminDateTime(item.updatedAt, { includeSeconds: true }))}
                {infoRow("Rezolvat", formatAdminDateTime(item.resolvedAt, { includeSeconds: true }))}
                {infoRow("Închis", formatAdminDateTime(item.closedAt, { includeSeconds: true }))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requester & Assignee</CardTitle>
                <CardDescription>Persoane implicate în ticket.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {infoRow(
                  "Requester",
                  item.requesterRole === "provider"
                    ? humanProviderLabel({
                      displayName: item.requester.displayName,
                      email: item.requester.email,
                    })
                    : humanUserLabel({
                      displayName: item.requester.displayName,
                      email: item.requester.email,
                    })
                )}
                {infoRow("Requester role", item.requester.role || "-")}
                {infoRow(
                  "Assignee",
                  item.assignedAdminUid
                    ? humanAdminLabel({
                      displayName: item.assignedAdminSnapshot?.displayName,
                      email: item.assignedAdminSnapshot?.email,
                    })
                    : "Neasignat"
                )}
                {infoRow("Notă admin", item.adminNote || "-")}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related entities</CardTitle>
                <CardDescription>Legături către booking/provider/user.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {infoRow("Booking", item.relatedEntity?.bookingId || "-")}
                {infoRow("Provider", item.relatedEntity?.providerId || "-")}
                {infoRow("User", item.relatedEntity?.userId || "-")}
                {item.relatedEntity?.bookingId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/programari/${encodeURIComponent(item.relatedEntity.bookingId)}`}>
                      Deschide booking
                    </Link>
                  </Button>
                ) : null}
                {item.relatedEntity?.providerId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/prestatori/${encodeURIComponent(item.relatedEntity.providerId)}`}>
                      Deschide provider
                    </Link>
                  </Button>
                ) : null}
                {item.relatedEntity?.userId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/utilizatori/${encodeURIComponent(item.relatedEntity.userId)}`}>
                      Deschide user
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actualizare ticket</CardTitle>
              <CardDescription>Toate câmpurile de update au fost mutate aici din listă.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={draft.status}
                      disabled={pending}
                      onChange={(event) => setDraft((current) => current ? { ...current, status: event.target.value } : current)}
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
                      disabled={pending}
                      onChange={(event) => setDraft((current) => current ? { ...current, priority: event.target.value } : current)}
                    >
                      {priorities.map((nextPriority) => (
                        <option key={nextPriority} value={nextPriority}>
                          {label(nextPriority)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AdminEntityLookup
                    value={draft.assignedAdminUid}
                    entityType="admin"
                    disabled={pending}
                    placeholder="Assignee admin"
                    onValueChange={(nextValue) =>
                      setDraft((current) => current ? { ...current, assignedAdminUid: nextValue } : current)
                    }
                  />

                  <Input
                    value={draft.adminNote}
                    placeholder="Notă internă"
                    disabled={pending}
                    onChange={(event) =>
                      setDraft((current) => current ? { ...current, adminNote: event.target.value } : current)
                    }
                  />

                  <div className="grid gap-2 md:grid-cols-[200px_minmax(0,1fr)]">
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={draft.relatedEntityType}
                      disabled={pending}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                              ...current,
                              relatedEntityType: event.target.value as "booking" | "provider" | "user",
                              relatedEntityId: "",
                            }
                            : current
                        )
                      }
                    >
                      <option value="booking">booking</option>
                      <option value="provider">provider</option>
                      <option value="user">user</option>
                    </select>

                    <AdminEntityLookup
                      value={draft.relatedEntityId}
                      entityType={draft.relatedEntityType}
                      disabled={pending}
                      placeholder={`Select ${draft.relatedEntityType}`}
                      onValueChange={(nextValue) =>
                        setDraft((current) => current ? { ...current, relatedEntityId: nextValue } : current)
                      }
                    />
                  </div>

                  <Button type="button" disabled={pending} onClick={() => void saveTicket()}>
                    <Save className="mr-2 h-4 w-4" />
                    {pending ? "Se salvează..." : "Salvează"}
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

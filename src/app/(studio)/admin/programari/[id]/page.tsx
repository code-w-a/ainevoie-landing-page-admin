"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ClipboardCopy,
  CreditCard,
  ExternalLink,
  LifeBuoy,
  MessageSquare,
  Star,
  UserRound,
} from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminBookingCase = {
  booking?: Record<string, any>;
  payment?: Record<string, any> | null;
  review?: Record<string, any> | null;
  provider?: Record<string, any> | null;
  user?: Record<string, any> | null;
  conversation?: Record<string, any> | null;
  supportTickets?: Array<Record<string, any>>;
  recentAuditEvents?: Array<Record<string, any>>;
};

function badgeVariant(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "confirmed" || status === "success" || status === "resolved") return "success";
  if (status === "failed" || status === "rejected" || status === "expired_unanswered" || status?.startsWith("cancelled") || status === "failure" || status === "urgent") return "danger";
  if (status === "requested" || status === "reschedule_proposed" || status === "in_progress" || status === "pending" || status === "under_review" || status === "flagged") return "warning";
  return "outline";
}

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function formatAmount(payment?: Record<string, any> | null) {
  const amount = Number(payment?.amount);
  const currency = payment?.currency || "RON";

  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }

  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatPricingContext(booking?: Record<string, any>) {
  const pricing = booking?.pricingSnapshot || {};
  const requestDetails = booking?.requestDetails || {};
  const rate = Number(pricing.ratePerHourPerProfessional ?? booking?.serviceSnapshot?.baseRateAmount ?? 0);
  const hours = Math.max(1, Number(requestDetails.estimatedHours ?? pricing.estimatedHours ?? 1) || 1);
  const professionals = Math.max(1, Number(requestDetails.professionalsCount ?? pricing.professionalsCount ?? 1) || 1);

  if (!Number.isFinite(rate) || rate <= 0) {
    return `${hours}h × ${professionals} pers`;
  }

  return `${hours}h × ${rate} × ${professionals} pers`;
}

function formatRequestResponseStatus(status?: string | null) {
  if (status === "pending") return "pending";
  if (status === "answered") return "answered";
  if (status === "expired") return "expired";
  return "-";
}

function parseMillis(value: unknown) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSla(requestResponse?: Record<string, any> | null) {
  if (!requestResponse?.deadlineAt) {
    return "Fără deadline";
  }
  const deadlineMs = parseMillis(requestResponse.deadlineAt);
  if (!deadlineMs) {
    return "Deadline invalid";
  }
  if (requestResponse.status === "answered") {
    return "Răspuns primit";
  }
  const diffMinutes = Math.round((deadlineMs - Date.now()) / 60_000);
  if (diffMinutes < 0) {
    return `Întârziat ${Math.abs(diffMinutes)} min`;
  }
  return `${diffMinutes} min rămase`;
}

function copyToClipboard(value?: string | null) {
  if (!value) {
    return;
  }
  void navigator.clipboard?.writeText(value);
}

function InfoRow({ label: rowLabel, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{rowLabel}</p>
      <p className="mt-1 break-words text-sm font-medium">{String(value || "-")}</p>
    </div>
  );
}

function MetricCard({ label: rowLabel, value, status }: { label: string; value: string; status?: string | null }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{rowLabel}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-lg font-semibold">{value}</p>
          {status ? <Badge variant={badgeVariant(status)}>{label(status)}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionLink({ href, icon: Icon, label: actionLabel }: { href: string; icon: typeof ExternalLink; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        <Icon className="mr-2 h-4 w-4" />
        {actionLabel}
      </Link>
    </Button>
  );
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = decodeURIComponent(params.id || "");
  const { data, loading, error } = useAdminData<AdminBookingCase>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}`
  );
  const booking = data?.booking || {};
  const payment = data?.payment || booking.paymentSummary || null;
  const review = data?.review || null;
  const conversation = data?.conversation || null;
  const supportTickets = data?.supportTickets || [];
  const auditEvents = data?.recentAuditEvents || [];
  const requestResponse = booking.requestResponse || null;
  const userName = humanUserLabel({
    displayName: booking.userSnapshot?.displayName || data?.user?.displayName,
    email: data?.user?.email || booking.userSnapshot?.email,
    phoneNumber: data?.user?.phoneNumber || booking.userSnapshot?.phoneNumber,
  });
  const providerName = humanProviderLabel({
    displayName: booking.providerSnapshot?.displayName || data?.provider?.professionalProfile?.displayName,
    businessName: data?.provider?.professionalProfile?.businessName,
    email: data?.provider?.email || booking.providerSnapshot?.email,
    phoneNumber: data?.provider?.phoneNumber,
  });
  const paymentId = payment?.paymentId || payment?.transactionId || payment?.stripePaymentIntentId || "";
  const conversationId = conversation?.conversationId || `conv_bk_${bookingId}`;
  const [pendingAction, setPendingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"open" | "in_progress" | "resolved">("open");
  const [linkedTicketId, setLinkedTicketId] = useState("");

  async function patchBookingCase(action: "cancel" | "update_case") {
    setPendingAction(true);
    setActionError(null);
    try {
      const response = await adminFetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/admin-case`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "cancel" ? reason.trim() : undefined,
          note: note.trim() || undefined,
          resolutionStatus,
          linkedTicketIds: linkedTicketId ? [linkedTicketId] : [],
        }),
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza cazul booking-ului."));
      }

      window.location.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza cazul booking-ului.");
    } finally {
      setPendingAction(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3">
            <Link href="/admin/programari">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la programări
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Caz programare</h1>
          <p className="text-xs text-muted-foreground">Cod intern: {bookingId}</p>
          <p className="text-sm text-muted-foreground">
            Triage sigur pentru booking, plată, persoane, conversație, suport, review și audit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {booking.status ? <Badge variant={badgeVariant(booking.status)}>{label(booking.status)}</Badge> : null}
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(bookingId)}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copiază booking ID
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Se încarcă programarea...</p>}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2">
            {booking.userId ? <ActionLink href={`/admin/utilizatori/${encodeURIComponent(booking.userId)}`} icon={UserRound} label="Deschide client" /> : null}
            {booking.providerId ? <ActionLink href={`/admin/prestatori/${encodeURIComponent(booking.providerId)}`} icon={UserRound} label="Deschide prestator" /> : null}
            <ActionLink href={`/admin/conversatii?conversationId=${encodeURIComponent(conversationId)}`} icon={MessageSquare} label="Deschide conversație" />
            <ActionLink href={`/admin/suport?q=${encodeURIComponent(bookingId)}`} icon={LifeBuoy} label="Suport asociat" />
            <ActionLink href={`/admin/plati?q=${encodeURIComponent(paymentId || bookingId)}`} icon={CreditCard} label="Plată" />
            {review?.reviewId ? <ActionLink href={`/admin/recenzii?q=${encodeURIComponent(review.reviewId)}`} icon={Star} label="Recenzie" /> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Booking" value={label(booking.status)} status={booking.status} />
            <MetricCard label="SLA răspuns prestator" value={formatSla(requestResponse)} status={requestResponse?.status} />
            <MetricCard label="Plată" value={formatAmount(payment)} status={payment?.status} />
            <MetricCard label="Suport" value={`${supportTickets.length} tichete`} status={supportTickets[0]?.priority} />
            <MetricCard label="Conversație" value={conversation ? label(conversation.status) : "Necreată"} status={conversation?.adminModeration?.status || conversation?.status} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Booking</CardTitle>
                <CardDescription>Detalii cerere și programare.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <InfoRow label="Status" value={label(booking.status)} />
                <InfoRow label="Început" value={formatAdminDateTime(booking.scheduledStartAt)} />
                <InfoRow label="Sfârșit" value={formatAdminDateTime(booking.scheduledEndAt)} />
                <InfoRow label="Timezone" value={booking.timezone} />
                <InfoRow label="SLA profil" value={requestResponse?.profile || "-"} />
                <InfoRow label="SLA status" value={formatRequestResponseStatus(requestResponse?.status)} />
                <InfoRow label="Deadline răspuns" value={formatAdminDateTime(requestResponse?.deadlineAt)} />
                <InfoRow label="Răspuns la" value={formatAdminDateTime(requestResponse?.answeredAt)} />
                <InfoRow label="Expirat la" value={formatAdminDateTime(requestResponse?.expiredAt)} />
                <InfoRow label="Profesioniști" value={booking.requestDetails?.professionalsCount} />
                <InfoRow label="Formulă preț" value={formatPricingContext(booking)} />
                <InfoRow label="Descriere" value={booking.requestDetails?.description} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plată</CardTitle>
                <CardDescription>Status și identificatori de procesare.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={badgeVariant(payment?.status)}>{label(payment?.status)}</Badge>
                </div>
                <InfoRow label="Total" value={formatAmount(payment)} />
                <InfoRow label="Procesator" value={label(payment?.processor)} />
                <InfoRow label="Metodă" value={label(payment?.method)} />
                <InfoRow label="Payment ID" value={payment?.paymentId || payment?.id} />
                <InfoRow label="Stripe PaymentIntent" value={payment?.stripePaymentIntentId} />
                <InfoRow label="Stripe Charge" value={payment?.stripeLatestChargeId} />
                <InfoRow label="Stripe status" value={payment?.stripeStatus} />
                <InfoRow label="Tranzacție" value={payment?.transactionId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Persoane</CardTitle>
                <CardDescription>Client și prestator implicați.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <InfoRow label="Client" value={userName} />
                <InfoRow label="User ID" value={booking.userId} />
                <InfoRow label="Email client" value={data?.user?.email || booking.userSnapshot?.email} />
                <InfoRow label="Telefon client" value={data?.user?.phoneNumber || booking.userSnapshot?.phoneNumber} />
                <InfoRow label="Prestator" value={providerName} />
                <InfoRow label="Provider ID" value={booking.providerId} />
                <InfoRow label="Email prestator" value={data?.provider?.email || booking.providerSnapshot?.email} />
                <InfoRow label="Serviciu" value={booking.serviceSnapshot?.name || booking.serviceId} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversație booking</CardTitle>
                <CardDescription>Context de moderare și acces rapid la thread.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversation ? (
                  <>
                    <InfoRow label="Conversation ID" value={conversation.conversationId || conversationId} />
                    <InfoRow label="Status" value={label(conversation.status)} />
                    <InfoRow label="Moderare" value={label(conversation.adminModeration?.status)} />
                    <InfoRow label="Ultimul mesaj" value={conversation.lastMessage?.preview} />
                    <InfoRow label="Actualizat" value={formatAdminDateTime(conversation.updatedAt)} />
                  </>
                ) : (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Nu există încă documentul de conversație {conversationId}.
                  </p>
                )}
                <ActionLink href={`/admin/conversatii?conversationId=${encodeURIComponent(conversationId)}`} icon={MessageSquare} label="Deschide în conversații" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suport asociat</CardTitle>
                <CardDescription>Tichete legate de booking, client sau prestator.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {supportTickets.map((ticket) => (
                  <Link
                    key={ticket.ticketId}
                    href={`/admin/suport?q=${encodeURIComponent(ticket.ticketId)}`}
                    className="block rounded-md border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{ticket.subject || ticket.ticketId}</p>
                      <Badge variant={badgeVariant(ticket.priority)}>{label(ticket.priority)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {label(ticket.status)} · {humanUserLabel({
                        displayName: ticket.requesterSnapshot?.displayName,
                        email: ticket.requesterSnapshot?.email,
                      }, "Requester necunoscut")}
                    </p>
                  </Link>
                ))}
                {!supportTickets.length && (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Nu există tichete asociate acestui caz.
                  </p>
                )}
                <ActionLink href={`/admin/suport?q=${encodeURIComponent(bookingId)}`} icon={LifeBuoy} label="Filtrează suport" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
              <CardDescription>Feedback legat de această programare, dacă există.</CardDescription>
            </CardHeader>
            <CardContent>
              {review ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <InfoRow label="Review ID" value={review.reviewId || review.id} />
                  <InfoRow label="Status" value={label(review.status)} />
                  <InfoRow label="Rating" value={review.rating} />
                  <InfoRow label="Creat" value={formatAdminDateTime(review.createdAt)} />
                  <div className="md:col-span-2 lg:col-span-4">
                    <InfoRow label="Comentariu" value={review.comment || review.body} />
                  </div>
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Nu există recenzie asociată booking-ului.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acțiuni admin</CardTitle>
              <CardDescription>
                Admin cancel (`cancelled_by_admin`), note interne, link ticket și status rezolvare.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Motiv (obligatoriu la admin cancel)"
                  value={reason}
                  disabled={pendingAction}
                  onChange={(event) => setReason(event.target.value)}
                />
                <input
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Notă internă"
                  value={note}
                  disabled={pendingAction}
                  onChange={(event) => setNote(event.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={resolutionStatus}
                  disabled={pendingAction}
                  onChange={(event) => setResolutionStatus(event.target.value as "open" | "in_progress" | "resolved")}
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                </select>
                <AdminEntityLookup
                  value={linkedTicketId}
                  entityType="supportTicket"
                  disabled={pendingAction}
                  placeholder="Link support ticket"
                  onValueChange={(nextValue) => setLinkedTicketId(nextValue)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  disabled={pendingAction || !reason.trim()}
                  onClick={() => {
                    void patchBookingCase("cancel");
                  }}
                >
                  Admin cancel booking
                </Button>
                <Button
                  variant="outline"
                  disabled={pendingAction}
                  onClick={() => {
                    void patchBookingCase("update_case");
                  }}
                >
                  Save case note
                </Button>
              </div>
              {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit recent</CardTitle>
              <CardDescription>Evenimente asociate booking-ului, plății și cazului.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Moment</TableHead>
                    <TableHead>Acțiune</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Resursă</TableHead>
                    <TableHead>Rezultat</TableHead>
                    <TableHead>Tranziție</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((event) => (
                    <TableRow key={event.eventId}>
                      <TableCell>{formatAdminDateTime(event.createdAt, { includeSeconds: true })}</TableCell>
                      <TableCell className="font-medium">{event.action || "-"}</TableCell>
                      <TableCell>{event.actorUid || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{event.resourceType || "-"}</span>
                          {event.resourceId ? (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(event.result)}>{label(event.result)}</Badge>
                      </TableCell>
                      <TableCell>{event.statusFrom || "-"} → {event.statusTo || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!auditEvents.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Nu există audit recent pentru această programare.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

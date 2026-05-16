"use client";

import type { ElementType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  ExternalLink,
  LifeBuoy,
  MessageSquare,
  RotateCw,
  ShieldCheck,
} from "lucide-react";

import {
  AdminLogStackSkeleton,
  AdminKpiRowSkeleton,
  AdminPageHeaderSkeleton,
  AdminStatCardsSkeleton,
  AdminTableSkeleton,
} from "@/components/admin/AdminSkeletonLayouts";
import { useAdminData } from "@/components/admin/useAdminData";
import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { providerStatusLabel, providerStatusVariant } from "@/lib/providers";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "danger";

type DashboardQueue = {
  total?: number;
  items?: Array<Record<string, unknown>>;
};

type DashboardResponse = {
  generatedAt?: string | null;
  summary?: Record<string, unknown> | null;
  queues?: {
    pendingProviders?: DashboardQueue;
    requestedBookings?: DashboardQueue;
    overdueBookingRequests?: DashboardQueue;
    rescheduleBookings?: DashboardQueue;
    failedPaymentBookings?: DashboardQueue;
    urgentSupportTickets?: DashboardQueue;
    flaggedConversations?: DashboardQueue;
  };
  recentAuditEvents?: DashboardQueue;
};

const bookingStatusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  requested: { label: "Cerere nouă", variant: "warning" },
  confirmed: { label: "Confirmată", variant: "success" },
  reschedule_proposed: { label: "Reprogramare", variant: "warning" },
  completed: { label: "Finalizată", variant: "success" },
  rejected: { label: "Respinsă", variant: "danger" },
  cancelled_by_user: { label: "Anulată client", variant: "danger" },
  cancelled_by_provider: { label: "Anulată prestator", variant: "danger" },
  cancelled_by_admin: { label: "Anulată admin", variant: "danger" },
};

const paymentStatusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: "Neplătită", variant: "outline" },
  in_progress: { label: "În procesare", variant: "warning" },
  paid: { label: "Plătită", variant: "success" },
  failed: { label: "Eșuată", variant: "danger" },
};

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readItems(queue?: DashboardQueue) {
  return Array.isArray(queue?.items) ? queue.items : [];
}

function readCountMap(value: unknown) {
  const source = readRecord(value);
  return Object.entries(source)
    .map(([key, count]) => ({ key, count: readNumber(count) }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function labelFromKey(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function bookingStatusLabel(value: unknown) {
  const status = readString(value);
  return bookingStatusMeta[status]?.label || labelFromKey(status || "-");
}

function bookingStatusVariant(value: unknown): BadgeVariant {
  const status = readString(value);
  return bookingStatusMeta[status]?.variant || "outline";
}

function paymentStatusLabel(value: unknown) {
  const status = readString(value);
  return paymentStatusMeta[status]?.label || labelFromKey(status || "-");
}

function paymentStatusVariant(value: unknown): BadgeVariant {
  const status = readString(value);
  return paymentStatusMeta[status]?.variant || "outline";
}

function providerName(item: Record<string, unknown>) {
  return (
    humanProviderLabel({
      displayName: readString(item.displayName),
      businessName: readString(item.businessName),
      email: readString(item.email),
      phoneNumber: readString(item.phoneNumber),
    })
  );
}

function providerId(item: Record<string, unknown>) {
  return readString(item.providerId) || readString(item.id) || readString(item.uid);
}

function bookingId(item: Record<string, unknown>) {
  return readString(item.bookingId) || readString(item.id);
}

function bookingPerson(item: Record<string, unknown>, key: "userSnapshot" | "providerSnapshot", fallbackKey: string) {
  const snapshot = readRecord(item[key]);
  if (key === "providerSnapshot") {
    const label = humanProviderLabel({
      displayName: readString(snapshot.displayName),
      businessName: readString(snapshot.businessName),
      email: readString(snapshot.email),
    }, "");
    if (label) return label;
    return readString(item[fallbackKey]) ? "Prestator necunoscut" : "-";
  }
  const label = humanUserLabel({
    displayName: readString(snapshot.displayName),
    email: readString(snapshot.email),
    phoneNumber: readString(snapshot.phoneNumber),
  }, "");
  if (label) return label;
  return readString(item[fallbackKey]) ? "Utilizator necunoscut" : "-";
}

function bookingService(item: Record<string, unknown>) {
  const service = readRecord(item.serviceSnapshot);
  return readString(service.name) || readString(service.serviceName) || readString(item.serviceId) || "-";
}

function formatAmount(item: Record<string, unknown>) {
  const payment = readRecord(item.paymentSummary);
  const amount = readNumber(payment.amount);
  const currency = readString(payment.currency) || "RON";
  if (amount <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
  }).format(amount);
}

function auditResourceHref(event: Record<string, unknown>) {
  const type = readString(event.resourceType);
  const id = readString(event.resourceId);
  if (!id) {
    return "";
  }
  if (type === "provider" || type === "providerDirectory") {
    return `/admin/prestatori/${encodeURIComponent(id)}`;
  }
  if (type === "booking" || type === "payment") {
    return `/admin/programari/${encodeURIComponent(id.replace(/^pay_/, ""))}`;
  }
  return "";
}

function KpiCard({
  icon: Icon,
  label,
  value,
  note,
  variant = "outline",
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  note: string;
  variant?: BadgeVariant;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <span className="rounded-md border border-border p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{note}</span>
        <Badge variant={variant}>{label}</Badge>
      </CardContent>
    </Card>
  );
}

function EmptyQueue({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ProviderQueue({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există prestatori în review acum." />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prestator</TableHead>
            <TableHead>Specializare</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trimis</TableHead>
            <TableHead className="text-right">Detalii</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const id = providerId(item);
            const status = readString(item.status);
            return (
              <TableRow key={id || providerName(item)}>
                <TableCell>
                  <div>
                    <p className="font-medium">{providerName(item)}</p>
                    <p className="text-xs text-muted-foreground">{readString(item.email) || id || "-"}</p>
                  </div>
                </TableCell>
                <TableCell>{readString(item.specialization) || "-"}</TableCell>
                <TableCell>
                  <Badge variant={providerStatusVariant(status)}>
                    {providerStatusLabel[status as keyof typeof providerStatusLabel] || labelFromKey(status || "-")}
                  </Badge>
                </TableCell>
                <TableCell>{formatAdminDateTime(readString(item.submittedAt))}</TableCell>
                <TableCell className="text-right">
                  {id ?
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/prestatori/${encodeURIComponent(id)}`}>Vezi</Link>
                    </Button>
                  : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function BookingQueue({
  items,
  emptyMessage,
  showPayment = false,
}: {
  items: Array<Record<string, unknown>>;
  emptyMessage: string;
  showPayment?: boolean;
}) {
  if (!items.length) {
    return <EmptyQueue message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Programare</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Prestator</TableHead>
            <TableHead>{showPayment ? "Plată" : "Status"}</TableHead>
            <TableHead className="text-right">Detalii</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const id = bookingId(item);
            const payment = readRecord(item.paymentSummary);
            return (
              <TableRow key={id || `${bookingPerson(item, "userSnapshot", "userId")}-${bookingService(item)}`}>
                <TableCell>
                  <div>
                    <p className="font-medium">{formatAdminDateTime(readString(item.scheduledStartAt))}</p>
                    <p className="text-xs text-muted-foreground">{bookingService(item)}</p>
                  </div>
                </TableCell>
                <TableCell>{bookingPerson(item, "userSnapshot", "userId")}</TableCell>
                <TableCell>{bookingPerson(item, "providerSnapshot", "providerId")}</TableCell>
                <TableCell>
                  {showPayment ?
                    <div className="space-y-1">
                      <Badge variant={paymentStatusVariant(payment.status)}>
                        {paymentStatusLabel(payment.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{formatAmount(item)}</p>
                    </div>
                  : <Badge variant={bookingStatusVariant(item.status)}>
                      {bookingStatusLabel(item.status)}
                    </Badge>}
                </TableCell>
                <TableCell className="text-right">
                  {id ?
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/programari/${encodeURIComponent(id)}`}>Vezi</Link>
                    </Button>
                  : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SupportQueue({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există tichete urgente active." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const id = readString(item.ticketId) || `ticket-${index}`;
        const requester = readRecord(item.requesterSnapshot);
        return (
          <div key={id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{readString(item.subject) || id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {readString(item.requesterRole) === "provider"
                    ? humanProviderLabel({
                        displayName: readString(requester.displayName),
                        email: readString(requester.email),
                      })
                    : humanUserLabel({
                        displayName: readString(requester.displayName),
                        email: readString(requester.email),
                      })}
                </p>
              </div>
              <Badge variant="danger">{readString(item.priority) || "urgent"}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{formatAdminDateTime(readString(item.updatedAt) || readString(item.createdAt), { includeSeconds: true })}</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/suport?q=${encodeURIComponent(id)}`}>Deschide</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConversationQueue({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există conversații flagged sau în review." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const id = readString(item.conversationId) || `conversation-${index}`;
        const status = readString(item.moderationStatus) || "flagged";
        return (
          <div key={id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Booking: {readString(item.bookingId) || "-"} · User: {humanUserLabel({
                    displayName: readString(readRecord(item.user).displayName),
                    email: readString(readRecord(item.user).email),
                  })}
                </p>
              </div>
              <Badge variant={status === "flagged" ? "danger" : "warning"}>{labelFromKey(status)}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{formatAdminDateTime(readString(item.updatedAt) || readString(item.createdAt), { includeSeconds: true })}</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/conversatii?conversationId=${encodeURIComponent(id)}`}>Deschide</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusDistribution({
  title,
  items,
  variantResolver,
}: {
  title: string;
  items: Array<{ key: string; count: number }>;
  variantResolver?: (key: string) => BadgeVariant;
}) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ?
          items.map((item) => (
            <Badge key={item.key} variant={variantResolver?.(item.key) || "outline"}>
              {labelFromKey(item.key)}: {item.count}
            </Badge>
          ))
        : <span className="text-sm text-muted-foreground">Nu există date încă.</span>}
      </div>
    </div>
  );
}

function AuditStack({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există evenimente recente de audit." />;
  }

  return (
    <div className="space-y-3">
      {items.map((event, index) => {
        const href = auditResourceHref(event);
        const transition = [readString(event.statusFrom), readString(event.statusTo)]
          .filter(Boolean)
          .join(" → ");
        return (
          <div key={readString(event.eventId) || index} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {labelFromKey(readString(event.action) || "Audit")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAdminDateTime(readString(event.createdAt), { includeSeconds: true })}
                </p>
              </div>
              <Badge variant={readString(event.result) === "failure" ? "danger" : "secondary"}>
                {readString(event.result) || "event"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{readString(event.actorRole) || "actor"}: {readString(event.actorUid) || "-"}</span>
              <span>Resursă: {readString(event.resourceType) || "-"}</span>
              {transition ? <span>{transition}</span> : null}
              {href ?
                <Link className="inline-flex items-center gap-1 text-primary" href={href}>
                  Deschide
                  <ExternalLink className="h-3 w-3" />
                </Link>
              : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminOperationalDashboardPage() {
  const { data, loading, error, reload } =
    useAdminData<DashboardResponse>("/api/admin/dashboard");

  const summary = readRecord(data?.summary);
  const totals = readRecord(summary.totals);
  const providersByStatus = readCountMap(summary.providersByStatus);
  const bookingsByStatus = readCountMap(summary.bookingsByStatus);
  const paymentsByStatus = readCountMap(summary.paymentsByStatus);
  const reviewsByStatus = readCountMap(summary.reviewsByStatus);
  const pendingProviders = readItems(data?.queues?.pendingProviders);
  const requestedBookings = readItems(data?.queues?.requestedBookings);
  const overdueBookingRequests = readItems(data?.queues?.overdueBookingRequests);
  const rescheduleBookings = readItems(data?.queues?.rescheduleBookings);
  const failedPaymentBookings = readItems(data?.queues?.failedPaymentBookings);
  const urgentSupportTickets = readItems(data?.queues?.urgentSupportTickets);
  const flaggedConversations = readItems(data?.queues?.flaggedConversations);
  const auditEvents = readItems(data?.recentAuditEvents);
  const lastUpdated = data?.generatedAt || readString(summary.generatedAt);

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeaderSkeleton />
        <AdminStatCardsSkeleton count={4} />
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cozi operaționale</CardTitle>
                <CardDescription>Elemente care au nevoie de atenție.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminTableSkeleton rows={5} columns={5} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribuții status</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminKpiRowSkeleton count={4} />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Audit recent</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminLogStackSkeleton lines={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard operațional</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Privire rapidă asupra prestatorilor, programărilor, plăților și auditului din aplicația mobilă.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ultima actualizare: {formatAdminDateTime(lastUpdated, { includeSeconds: true })}
          </p>
        </div>
        <Button variant="outline" onClick={() => void reload()}>
          <RotateCw className="h-4 w-4" />
          Reîncarcă
        </Button>
      </div>

      {error ?
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void reload()}>
              Reîncearcă
            </Button>
          </div>
        </div>
      : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={BriefcaseBusiness}
          label="Prestatori"
          value={readNumber(totals.providers)}
          note="profiluri înregistrate"
          variant="secondary"
        />
        <KpiCard
          icon={ShieldCheck}
          label="În review"
          value={readNumber(summary.pendingProviderReviewCount)}
          note="așteaptă decizie admin"
          variant={readNumber(summary.pendingProviderReviewCount) > 0 ? "warning" : "success"}
        />
        <KpiCard
          icon={CalendarClock}
          label="Programări cu atenție"
          value={readNumber(summary.openBookingIssueCount)}
          note="cereri, reprogramări sau plăți eșuate"
          variant={readNumber(summary.openBookingIssueCount) > 0 ? "warning" : "success"}
        />
        <KpiCard
          icon={CreditCard}
          label="Plăți eșuate"
          value={paymentsByStatus.find((item) => item.key === "failed")?.count || failedPaymentBookings.length}
          note="necesită verificare"
          variant={failedPaymentBookings.length > 0 ? "danger" : "success"}
        />
        <KpiCard
          icon={LifeBuoy}
          label="Suport urgent"
          value={urgentSupportTickets.length}
          note="tichete active cu prioritate urgent"
          variant={urgentSupportTickets.length > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cozi operaționale</CardTitle>
              <CardDescription>
                Liste scurte pentru elementele care cer atenție imediată.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Prestatori în review</h2>
                    <p className="text-xs text-muted-foreground">
                      {data?.queues?.pendingProviders?.total ?? pendingProviders.length} total
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/prestatori?status=pending_review">Toți</Link>
                  </Button>
                </div>
                <ProviderQueue items={pendingProviders} />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Cereri de programare</h2>
                    <p className="text-xs text-muted-foreground">
                      {data?.queues?.requestedBookings?.total ?? requestedBookings.length} total
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/programari?status=requested">Toate</Link>
                  </Button>
                </div>
                <BookingQueue
                  items={requestedBookings}
                  emptyMessage="Nu există cereri de programare nepreluate."
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Cereri fără răspuns în SLA</h2>
                    <p className="text-xs text-muted-foreground">
                      {data?.queues?.overdueBookingRequests?.total ?? overdueBookingRequests.length} total
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/programari?status=requested">Toate cererile</Link>
                  </Button>
                </div>
                <BookingQueue
                  items={overdueBookingRequests}
                  emptyMessage="Nu există cereri întârziate peste deadline-ul de răspuns."
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Reprogramări propuse</h2>
                    <p className="text-xs text-muted-foreground">
                      {data?.queues?.rescheduleBookings?.total ?? rescheduleBookings.length} total
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/programari?status=reschedule_proposed">Toate</Link>
                  </Button>
                </div>
                <BookingQueue
                  items={rescheduleBookings}
                  emptyMessage="Nu există reprogramări propuse în acest moment."
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Plăți eșuate</h2>
                    <p className="text-xs text-muted-foreground">
                      {data?.queues?.failedPaymentBookings?.total ?? failedPaymentBookings.length} total
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/programari?paymentStatus=failed">Toate</Link>
                  </Button>
                </div>
                <BookingQueue
                  items={failedPaymentBookings}
                  emptyMessage="Nu există plăți eșuate de verificat."
                  showPayment
                />
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-semibold">
                        <LifeBuoy className="h-4 w-4" />
                        Suport urgent
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {data?.queues?.urgentSupportTickets?.total ?? urgentSupportTickets.length} total
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/admin/suport?priority=urgent">Toate</Link>
                    </Button>
                  </div>
                  <SupportQueue items={urgentSupportTickets} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        Conversații moderate
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {data?.queues?.flaggedConversations?.total ?? flaggedConversations.length} total
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/admin/conversatii?moderationStatus=flagged">Flagged</Link>
                    </Button>
                  </div>
                  <ConversationQueue items={flaggedConversations} />
                </div>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuții status</CardTitle>
              <CardDescription>
                Volum curent pe statusuri pentru obiectele principale.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <StatusDistribution
                title="Prestatori"
                items={providersByStatus}
                variantResolver={providerStatusVariant}
              />
              <StatusDistribution
                title="Programări"
                items={bookingsByStatus}
                variantResolver={bookingStatusVariant}
              />
              <StatusDistribution
                title="Plăți"
                items={paymentsByStatus}
                variantResolver={paymentStatusVariant}
              />
              <StatusDistribution title="Review-uri" items={reviewsByStatus} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Audit recent
              </CardTitle>
              <CardDescription>
                Ultimele evenimente operaționale din aplicație.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditStack items={auditEvents} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot sistem</CardTitle>
              <CardDescription>Totaluri din colecțiile principale.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Programări</span>
                <span className="font-medium">{readNumber(totals.bookings)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plăți</span>
                <span className="font-medium">{readNumber(totals.payments)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Review-uri</span>
                <span className="font-medium">{readNumber(totals.reviews)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Audit events</span>
                <span className="font-medium">{readNumber(totals.auditEvents)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

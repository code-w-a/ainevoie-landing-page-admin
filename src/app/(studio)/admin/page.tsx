"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  CreditCard,
  LifeBuoy,
  MessageSquare,
  RotateCw,
  ShieldCheck,
} from "lucide-react";

import {
  AdminPageHeaderSkeleton,
  AdminStatCardsSkeleton,
  AdminTableSkeleton,
} from "@/components/admin/AdminSkeletonLayouts";
import { useAdminData } from "@/components/admin/useAdminData";
import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  draft_payment: { label: "Așteaptă garanția", variant: "warning" },
  requested: { label: "Cerere nouă", variant: "warning" },
  confirmation_pending: { label: "Confirmare în curs", variant: "warning" },
  confirmed: { label: "Confirmată", variant: "success" },
  payment_expired: { label: "Garanție expirată", variant: "danger" },
  reschedule_proposed: { label: "Reprogramare", variant: "warning" },
  completed: { label: "Finalizată", variant: "success" },
  rejected: { label: "Respinsă", variant: "danger" },
  cancelled_by_user: { label: "Anulată client", variant: "danger" },
  cancelled_by_provider: { label: "Anulată prestator", variant: "danger" },
  cancelled_by_admin: { label: "Anulată admin", variant: "danger" },
};

const paymentStatusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: "Neplătită", variant: "outline" },
  authorizing: { label: "Autorizare", variant: "warning" },
  in_progress: { label: "În procesare", variant: "warning" },
  authorized: { label: "Sumă blocată", variant: "warning" },
  capturing: { label: "Încasare", variant: "warning" },
  paid: { label: "Plătită", variant: "success" },
  failed: { label: "Eșuată", variant: "danger" },
  released: { label: "Garanție eliberată", variant: "outline" },
  capture_failed: { label: "Încasare eșuată", variant: "danger" },
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

function priorityTone(count: number): BadgeVariant {
  if (count > 0) return "warning";
  return "success";
}

function riskTone(count: number): BadgeVariant {
  if (count > 0) return "danger";
  return "success";
}

function queueTotal(queue: DashboardQueue | undefined, fallbackItems: Array<Record<string, unknown>>) {
  return queue?.total ?? fallbackItems.length;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p> : null}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyQueue({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  value,
  summary,
  href,
  cta,
  tone,
}: {
  icon: ElementType;
  title: string;
  value: number;
  summary: string;
  href: string;
  cta: string;
  tone: BadgeVariant;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="rounded-lg border border-border bg-background p-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <span>{title}</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-semibold leading-none">{value}</span>
            <Badge variant={tone}>{value > 0 ? "Atenție" : "OK"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>
      <Button asChild className="mt-4 w-full justify-between" variant="outline">
        <Link href={href}>
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  hint,
  variant = "outline",
}: {
  label: string;
  value: number;
  hint: string;
  variant?: BadgeVariant;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Badge variant={variant}>{value}</Badge>
    </div>
  );
}

function PreviewCard({
  title,
  description,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={href}>{hrefLabel}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function ProviderPreview({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există prestatori în review acum." />;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item) => {
        const id = providerId(item);
        const status = readString(item.status);
        return (
          <div key={id || providerName(item)} className="rounded-lg border border-border/80 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{providerName(item)}</p>
                <p className="text-xs text-muted-foreground">
                  {readString(item.specialization) || "Fără specializare"} · {formatAdminDateTime(readString(item.submittedAt))}
                </p>
              </div>
              <Badge variant={providerStatusVariant(status)}>
                {providerStatusLabel[status as keyof typeof providerStatusLabel] || labelFromKey(status || "-")}
              </Badge>
            </div>
            {id ?
              <Button asChild className="mt-3" size="sm" variant="ghost">
                <Link href={`/admin/prestatori/${encodeURIComponent(id)}`}>Deschide profilul</Link>
              </Button>
            : null}
          </div>
        );
      })}
    </div>
  );
}

function BookingPreview({
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
    <div className="space-y-3">
      {items.slice(0, 4).map((item) => {
        const id = bookingId(item);
        const payment = readRecord(item.paymentSummary);
        return (
          <div
            key={id || `${bookingPerson(item, "userSnapshot", "userId")}-${bookingService(item)}`}
            className="rounded-lg border border-border/80 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{bookingService(item)}</p>
                <p className="text-xs text-muted-foreground">
                  {bookingPerson(item, "userSnapshot", "userId")} · {bookingPerson(item, "providerSnapshot", "providerId")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAdminDateTime(readString(item.scheduledStartAt))}
                </p>
              </div>
              {showPayment ?
                <div className="text-right">
                  <Badge variant={paymentStatusVariant(payment.status)}>
                    {paymentStatusLabel(payment.status)}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{formatAmount(item)}</p>
                </div>
              : <Badge variant={bookingStatusVariant(item.status)}>
                  {bookingStatusLabel(item.status)}
                </Badge>}
            </div>
            {id ?
              <Button asChild className="mt-3" size="sm" variant="ghost">
                <Link href={`/admin/programari/${encodeURIComponent(id)}`}>Deschide programarea</Link>
              </Button>
            : null}
          </div>
        );
      })}
    </div>
  );
}

function SupportPreview({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există tichete urgente active." />;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item, index) => {
        const id = readString(item.ticketId) || `ticket-${index}`;
        const requester = readRecord(item.requesterSnapshot);
        return (
          <div key={id} className="rounded-md border border-border/80 p-3">
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

function ConversationPreview({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) {
    return <EmptyQueue message="Nu există conversații cu probleme în acest moment." />;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item, index) => {
        const id = readString(item.conversationId) || `conversation-${index}`;
        const status = readString(item.moderationStatus) || "flagged";
        return (
          <div key={id} className="rounded-md border border-border/80 p-3">
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

export default function AdminOperationalDashboardPage() {
  const { data, loading, error, reload } =
    useAdminData<DashboardResponse>("/api/admin/dashboard");

  const summary = readRecord(data?.summary);
  const totals = readRecord(summary.totals);
  const pendingProviders = readItems(data?.queues?.pendingProviders);
  const requestedBookings = readItems(data?.queues?.requestedBookings);
  const overdueBookingRequests = readItems(data?.queues?.overdueBookingRequests);
  const rescheduleBookings = readItems(data?.queues?.rescheduleBookings);
  const failedPaymentBookings = readItems(data?.queues?.failedPaymentBookings);
  const urgentSupportTickets = readItems(data?.queues?.urgentSupportTickets);
  const flaggedConversations = readItems(data?.queues?.flaggedConversations);
  const lastUpdated = data?.generatedAt || readString(summary.generatedAt);
  const pendingProvidersTotal = queueTotal(data?.queues?.pendingProviders, pendingProviders);
  const requestedBookingsTotal = queueTotal(data?.queues?.requestedBookings, requestedBookings);
  const overdueBookingsTotal = queueTotal(data?.queues?.overdueBookingRequests, overdueBookingRequests);
  const rescheduleBookingsTotal = queueTotal(data?.queues?.rescheduleBookings, rescheduleBookings);
  const failedPaymentsTotal = queueTotal(data?.queues?.failedPaymentBookings, failedPaymentBookings);
  const urgentSupportTotal = queueTotal(data?.queues?.urgentSupportTickets, urgentSupportTickets);
  const flaggedConversationsTotal = queueTotal(data?.queues?.flaggedConversations, flaggedConversations);

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeaderSkeleton />
        <AdminStatCardsSkeleton count={4} />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Atenție acum</CardTitle>
              <CardDescription>Zonele care cer decizii rapide.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTableSkeleton rows={5} columns={5} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activitate în platformă</CardTitle>
              <CardDescription>Sumar business pentru client.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTableSkeleton rows={5} columns={2} />
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
            O vedere clară asupra lucrurilor care trebuie urmărite și a principalelor date din platformă.
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
          label="Așteaptă aprobare"
          value={pendingProvidersTotal}
          note="prestatori în așteptare"
          variant={priorityTone(pendingProvidersTotal)}
        />
        <KpiCard
          icon={CalendarClock}
          label="Cereri noi"
          value={requestedBookingsTotal}
          note="programări care cer răspuns"
          variant={priorityTone(requestedBookingsTotal)}
        />
        <KpiCard
          icon={CreditCard}
          label="Probleme la plată"
          value={failedPaymentsTotal}
          note="necesită verificare"
          variant={riskTone(failedPaymentsTotal)}
        />
        <KpiCard
          icon={LifeBuoy}
          label="Suport urgent"
          value={urgentSupportTotal}
          note="tichete active cu prioritate urgent"
          variant={riskTone(urgentSupportTotal)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-muted/30">
            <SectionHeading
              eyebrow="Azi"
              title="Atenție acum"
              description="Aceste zone cer decizie sau verificare rapidă."
            />
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <ActionCard
              icon={ShieldCheck}
              title="Prestatori în așteptare"
              value={pendingProvidersTotal}
              summary="Profiluri trimise care au nevoie de aprobare sau respingere."
              href="/admin/prestatori?status=pending_review"
              cta="Vezi prestatorii"
              tone={priorityTone(pendingProvidersTotal)}
            />
            <ActionCard
              icon={CalendarClock}
              title="Cereri noi"
              value={requestedBookingsTotal}
              summary="Programări noi care așteaptă răspuns și confirmare."
              href="/admin/programari?status=requested"
              cta="Vezi cererile"
              tone={priorityTone(requestedBookingsTotal)}
            />
            <ActionCard
              icon={Clock3}
              title="Necesită răspuns"
              value={overdueBookingsTotal}
              summary="Cereri care întârzie și pot afecta experiența clientului."
              href="/admin/programari?status=requested"
              cta="Verifică întârzierile"
              tone={riskTone(overdueBookingsTotal)}
            />
            <ActionCard
              icon={CreditCard}
              title="Probleme la plată"
              value={failedPaymentsTotal}
              summary="Plăți care au nevoie de verificare sau contact cu clientul."
              href="/admin/programari?paymentStatus=failed"
              cta="Vezi plățile"
              tone={riskTone(failedPaymentsTotal)}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-muted/30">
            <SectionHeading
              eyebrow="Sumar"
              title="Activitate în platformă"
              description="O imagine scurtă a situației curente din business."
            />
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <SummaryRow
              label="Prestatori activi în platformă"
              value={readNumber(totals.providers)}
              hint="Baza totală de prestatori înregistrați."
              variant="secondary"
            />
            <SummaryRow
              label="Programări care cer atenție"
              value={readNumber(summary.openBookingIssueCount)}
              hint="Cereri noi, reprogramări sau plăți cu probleme."
              variant={priorityTone(readNumber(summary.openBookingIssueCount))}
            />
            <SummaryRow
              label="Reprogramări propuse"
              value={rescheduleBookingsTotal}
              hint="Programări care trebuie reconfirmate."
              variant={priorityTone(rescheduleBookingsTotal)}
            />
            <SummaryRow
              label="Tichete urgente"
              value={urgentSupportTotal}
              hint="Solicitări care pot afecta direct experiența clientului."
              variant={riskTone(urgentSupportTotal)}
            />
            <SummaryRow
              label="Conversații cu probleme"
              value={flaggedConversationsTotal}
              hint="Discuții care pot cere verificare sau intervenție."
              variant={riskTone(flaggedConversationsTotal)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <SectionHeading
          eyebrow="Liste de lucru"
          title="Zonele pe care merită să le deschizi"
          description="Am lăsat doar preview-uri scurte, ca să vezi imediat ce merită urmărit."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewCard
            title="Prestatori în așteptare"
            description={`${pendingProvidersTotal} profiluri care cer aprobare.`}
            href="/admin/prestatori?status=pending_review"
            hrefLabel="Toți prestatorii"
          >
            <ProviderPreview items={pendingProviders} />
          </PreviewCard>

          <PreviewCard
            title="Cereri noi de programare"
            description={`${requestedBookingsTotal} cereri care trebuie confirmate.`}
            href="/admin/programari?status=requested"
            hrefLabel="Toate cererile"
          >
            <BookingPreview
              items={requestedBookings}
              emptyMessage="Nu există cereri de programare nepreluate."
            />
          </PreviewCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <PreviewCard
            title="Necesită răspuns"
            description={`${overdueBookingsTotal} cereri fără răspuns rapid.`}
            href="/admin/programari?status=requested"
            hrefLabel="Vezi întârzierile"
          >
            <BookingPreview
              items={overdueBookingRequests}
              emptyMessage="Nu există cereri întârziate peste timpul dorit de răspuns."
            />
          </PreviewCard>

          <PreviewCard
            title="Plăți cu probleme"
            description={`${failedPaymentsTotal} situații care cer verificare.`}
            href="/admin/programari?paymentStatus=failed"
            hrefLabel="Vezi plățile"
          >
            <BookingPreview
              items={failedPaymentBookings}
              emptyMessage="Nu există plăți eșuate de verificat."
              showPayment
            />
          </PreviewCard>

          <PreviewCard
            title="Reprogramări propuse"
            description={`${rescheduleBookingsTotal} programări care trebuie confirmate.`}
            href="/admin/programari?status=reschedule_proposed"
            hrefLabel="Vezi reprogramările"
          >
            <BookingPreview
              items={rescheduleBookings}
              emptyMessage="Nu există reprogramări propuse în acest moment."
            />
          </PreviewCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewCard
            title="Suport urgent"
            description={`${urgentSupportTotal} tichete cu impact imediat.`}
            href="/admin/suport?priority=urgent"
            hrefLabel="Vezi suportul"
          >
            <SupportPreview items={urgentSupportTickets} />
          </PreviewCard>

          <PreviewCard
            title="Conversații cu probleme"
            description={`${flaggedConversationsTotal} conversații care cer atenție.`}
            href="/admin/conversatii?moderationStatus=flagged"
            hrefLabel="Vezi conversațiile"
          >
            <ConversationPreview items={flaggedConversations} />
          </PreviewCard>
        </div>
      </div>
    </div>
  );
}

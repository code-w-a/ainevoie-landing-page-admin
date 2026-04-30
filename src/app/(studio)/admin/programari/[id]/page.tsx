"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAdminData } from "@/components/admin/useAdminData";
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
  recentAuditEvents?: Array<Record<string, any>>;
};

function badgeVariant(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "confirmed" || status === "success") return "success";
  if (status === "failed" || status === "rejected" || status?.startsWith("cancelled") || status === "failure") return "danger";
  if (status === "requested" || status === "reschedule_proposed" || status === "in_progress") return "warning";
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

function InfoRow({ label: rowLabel, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{rowLabel}</p>
      <p className="mt-1 break-words text-sm font-medium">{String(value || "-")}</p>
    </div>
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
  const auditEvents = data?.recentAuditEvents || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3">
            <Link href="/admin/programari">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la programări
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Programare {bookingId}</h1>
          <p className="text-sm text-muted-foreground">
            Booking, plată și audit operațional.
          </p>
        </div>
        {booking.status && (
          <Badge variant={badgeVariant(booking.status)}>{label(booking.status)}</Badge>
        )}
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Se încarcă programarea...</p>}

      {!loading && !error && (
        <>
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
                <InfoRow label="Descriere" value={booking.requestDetails?.description} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plată</CardTitle>
                <CardDescription>Status și identificatori Stripe.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={badgeVariant(payment?.status)}>{label(payment?.status)}</Badge>
                </div>
                <InfoRow label="Total" value={formatAmount(payment)} />
                <InfoRow label="Procesator" value={label(payment?.processor)} />
                <InfoRow label="Metodă" value={label(payment?.method)} />
                <InfoRow label="Stripe PaymentIntent" value={payment?.stripePaymentIntentId} />
                <InfoRow label="Stripe Charge" value={payment?.stripeLatestChargeId} />
                <InfoRow label="Stripe status" value={payment?.stripeStatus} />
                <InfoRow label="Tranzacție" value={payment?.transactionId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Persoane</CardTitle>
                <CardDescription>Client și prestator.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <InfoRow label="Client" value={booking.userSnapshot?.displayName || data?.user?.displayName || booking.userId} />
                <InfoRow label="User ID" value={booking.userId} />
                <InfoRow label="Prestator" value={booking.providerSnapshot?.displayName || data?.provider?.professionalProfile?.displayName || booking.providerId} />
                <InfoRow label="Provider ID" value={booking.providerId} />
                <InfoRow label="Serviciu" value={booking.serviceSnapshot?.name || booking.serviceId} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit recent</CardTitle>
              <CardDescription>Evenimente asociate booking-ului și plății.</CardDescription>
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

"use client";

import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatCompactValue,
  type AuditEventItem,
  type BookingDocument,
  type PaymentDocument,
} from "@/lib/adminBookingDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function BookingTechnicalDetails({
  booking,
  bookingId,
  payment,
  conversation,
  conversationId,
  review,
  supportTickets,
  auditEvents,
}: {
  booking: BookingDocument;
  bookingId: string;
  payment: PaymentDocument | null;
  conversation?: Record<string, unknown> | null;
  conversationId: string;
  review?: Record<string, unknown> | null;
  supportTickets: Array<Record<string, unknown>>;
  auditEvents: AuditEventItem[];
}) {
  return (
    <details id="booking-technical-details" className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-6 py-4 text-sm font-medium">
        Detalii tehnice
      </summary>
      <div className="space-y-6 border-t border-border px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue label="Booking ID" value={bookingId} />
          <FieldValue label="User ID" value={formatCompactValue(booking.userId)} />
          <FieldValue label="Provider ID" value={formatCompactValue(booking.providerId)} />
          <FieldValue label="Service ID" value={formatCompactValue(booking.serviceId)} />
          <FieldValue label="Timezone" value={formatCompactValue(booking.timezone)} />
          <FieldValue label="Status brut" value={formatCompactValue(booking.status)} />
          <FieldValue label="SLA profile" value={formatCompactValue(booking.requestResponse?.profile)} />
          <FieldValue
            label="SLA status brut"
            value={formatCompactValue(booking.requestResponse?.status)}
          />
          <FieldValue
            label="Deadline răspuns"
            value={formatAdminDateTime(booking.requestResponse?.deadlineAt)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue label="Payment ID" value={formatCompactValue(payment?.paymentId || payment?.id)} />
          <FieldValue
            label="Stripe PaymentIntent"
            value={formatCompactValue(payment?.stripePaymentIntentId)}
          />
          <FieldValue
            label="Stripe Charge"
            value={formatCompactValue(payment?.stripeLatestChargeId)}
          />
          <FieldValue label="Stripe status" value={formatCompactValue(payment?.stripeStatus)} />
          <FieldValue label="Tranzacție" value={formatCompactValue(payment?.transactionId)} />
          <FieldValue label="Status plată brut" value={formatCompactValue(payment?.status)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue label="Conversation ID" value={conversationId} />
          <FieldValue
            label="Conversation status brut"
            value={formatCompactValue(conversation?.status)}
          />
          <FieldValue
            label="Review ID"
            value={formatCompactValue(review?.reviewId || review?.id)}
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Support ticket IDs</p>
          {supportTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există ticket IDs.</p>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              {supportTickets.map((ticket) => (
                <p key={String(ticket.ticketId)}>
                  {String(ticket.ticketId)} · {String(ticket.status || "-")}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Evenimente audit (raw)</p>
          {auditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există evenimente de audit.</p>
          ) : (
            <div className="space-y-3">
              {auditEvents.map((event) => (
                <div key={String(event.eventId)} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{event.action || "-"}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatAdminDateTime(event.createdAt, { includeSeconds: true })} ·{" "}
                    {event.resourceType || "-"} · {event.resourceId || "-"} · {event.result || "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Actor: {event.actorUid || "-"} ({event.actorRole || "-"}) · {event.statusFrom || "-"}{" "}
                    → {event.statusTo || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

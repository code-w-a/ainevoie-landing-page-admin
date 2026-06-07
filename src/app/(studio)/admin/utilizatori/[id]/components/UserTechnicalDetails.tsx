"use client";

import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatAuthProvider,
  formatCompactValue,
  getUserId,
  type AuditEventItem,
  type BookingListItem,
  type UserDocument,
} from "@/lib/adminUserDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function UserTechnicalDetails({
  user,
  userId,
  recentBookings,
  recentAuditEvents,
}: {
  user: UserDocument;
  userId: string;
  recentBookings: BookingListItem[];
  recentAuditEvents: AuditEventItem[];
}) {
  return (
    <details id="user-technical-details" className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-6 py-4 text-sm font-medium">
        Detalii tehnice
      </summary>
      <div className="space-y-6 border-t border-border px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue label="User ID" value={getUserId(user, userId)} />
          <FieldValue label="Rol" value={formatCompactValue(user.role, "user")} />
          <FieldValue
            label="Metodă autentificare"
            value={
              user.authProviders?.length
                ? user.authProviders.map((provider) => formatAuthProvider(provider)).join(", ")
                : "-"
            }
          />
          <FieldValue label="Actualizat la" value={formatAdminDateTime(user.updatedAt)} />
          <FieldValue
            label="Status caz (raw)"
            value={formatCompactValue(user.adminCaseSnapshot?.resolutionStatus)}
          />
          <FieldValue
            label="Notă caz (raw)"
            value={formatCompactValue(user.adminCaseSnapshot?.latestNote)}
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Booking IDs</p>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există booking IDs.</p>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              {recentBookings.map((booking) => (
                <p key={booking.bookingId || booking.scheduledStartAt}>
                  {booking.bookingId || "-"} · {booking.status || "-"} ·{" "}
                  {formatAdminDateTime(booking.scheduledStartAt)}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Payment IDs</p>
          {recentBookings.every((booking) => !booking.paymentSummary?.paymentId) ? (
            <p className="text-sm text-muted-foreground">Nu există payment IDs.</p>
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              {recentBookings.map((booking) => (
                <p key={`${booking.bookingId}-payment`}>
                  {booking.paymentSummary?.paymentId || "-"} ·{" "}
                  {booking.paymentSummary?.transactionId || "-"} ·{" "}
                  {booking.paymentSummary?.status || "-"}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Evenimente audit (raw)</p>
          {recentAuditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există evenimente de audit.</p>
          ) : (
            <div className="space-y-3">
              {recentAuditEvents.map((event) => (
                <div key={event.eventId} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{event.action || "-"}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatAdminDateTime(event.createdAt)} · {event.resourceType || "-"} ·{" "}
                    {event.resourceId || "-"} · {event.result || "-"}
                  </p>
                  {event.actorUid && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Actor: {event.actorUid} ({event.actorRole || "-"})
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

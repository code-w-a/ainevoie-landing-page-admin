"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatBookingStatusLabel,
  readString,
  type TimelineEvent,
} from "@/lib/adminProviderDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function ProviderActivityTab({
  timelineEvents,
  recentBookings,
}: {
  timelineEvents: TimelineEvent[];
  recentBookings: Array<Record<string, unknown>>;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activitate recentă</CardTitle>
          <CardDescription>Evenimentele importante legate de acest prestator.</CardDescription>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există activitate recentă.</p>
          ) : (
            <div className="space-y-3">
              {timelineEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{formatAdminDateTime(event.at)}</p>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {recentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Programări recente</CardTitle>
            <CardDescription>Ultimele programări asociate prestatorului.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Serviciu</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.slice(0, 8).map((booking, index) => {
                  const bookingId = readString(booking.bookingId);
                  const serviceSnapshot = (booking.serviceSnapshot as Record<string, unknown> | undefined) || {};
                  const serviceName = String(
                    serviceSnapshot.name || serviceSnapshot.serviceName || "Programare"
                  );
                  return (
                    <TableRow
                      key={bookingId || index}
                      className={bookingId ? "cursor-pointer hover:bg-muted/40" : undefined}
                      onClick={
                        bookingId
                          ? () => router.push(`/admin/programari/${encodeURIComponent(bookingId)}`)
                          : undefined
                      }
                    >
                      <TableCell>{formatAdminDateTime(booking.scheduledStartAt)}</TableCell>
                      <TableCell className={bookingId ? "underline underline-offset-2" : undefined}>
                        {serviceName}
                      </TableCell>
                      <TableCell>{formatBookingStatusLabel(booking.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

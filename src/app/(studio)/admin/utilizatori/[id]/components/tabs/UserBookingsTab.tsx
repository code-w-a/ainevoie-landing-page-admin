"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatUserBookingStatusLabel,
  type BookingListItem,
} from "@/lib/adminUserDetail";
import { humanProviderLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function UserBookingsTab({ bookings }: { bookings: BookingListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări</CardTitle>
        <CardDescription>Programările recente ale utilizatorului.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data și ora</TableHead>
              <TableHead>Prestator</TableHead>
              <TableHead>Serviciu</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acțiune</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nu există programări recente.
                </TableCell>
              </TableRow>
            )}
            {bookings.map((booking) => {
              const serviceName =
                booking.serviceSnapshot?.title || booking.serviceSnapshot?.name || "Programare";
              return (
                <TableRow key={booking.bookingId || `${booking.scheduledStartAt}-${serviceName}`}>
                  <TableCell>{formatAdminDateTime(booking.scheduledStartAt)}</TableCell>
                  <TableCell>
                    {humanProviderLabel({
                      displayName: booking.providerSnapshot?.displayName,
                      businessName: booking.providerSnapshot?.businessName,
                    })}
                  </TableCell>
                  <TableCell>{serviceName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatUserBookingStatusLabel(booking.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.bookingId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/programari/${booking.bookingId}`}>Vezi detalii</Link>
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatValue,
  getProviderDisplayName,
  getUserDisplayName,
  type BookingDocument,
} from "@/lib/adminBookingDetail";

export function BookingPartiesTab({
  booking,
  user,
  provider,
}: {
  booking: BookingDocument;
  user?: Record<string, unknown> | null;
  provider?: Record<string, unknown> | null;
}) {
  const userSnapshot = booking.userSnapshot || {};
  const providerSnapshot = booking.providerSnapshot || {};

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
          <CardDescription>Informațiile clientului implicat în programare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldValue label="Nume" value={getUserDisplayName(booking, user)} />
            <FieldValue
              label="Email"
              value={formatValue(userSnapshot.email || user?.email)}
            />
            <FieldValue
              label="Telefon"
              value={formatValue(userSnapshot.phoneNumber || user?.phoneNumber)}
            />
          </div>
          {booking.userId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/utilizatori/${encodeURIComponent(String(booking.userId))}`}>
                Vezi profil client
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prestator</CardTitle>
          <CardDescription>Informațiile prestatorului care deservește programarea.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldValue label="Nume" value={getProviderDisplayName(booking, provider)} />
            <FieldValue
              label="Email"
              value={formatValue(providerSnapshot.email || provider?.email)}
            />
            <FieldValue
              label="Telefon"
              value={formatValue(provider?.phoneNumber)}
            />
          </div>
          {booking.providerId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/prestatori/${encodeURIComponent(String(booking.providerId))}`}>
                Vezi profil prestator
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

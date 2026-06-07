"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatPricingContext,
  formatSlaSummary,
  formatValue,
  getOperationalBookingState,
  getServiceName,
  type BookingDocument,
  type PaymentDocument,
} from "@/lib/adminBookingDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function BookingSummaryTab({
  booking,
  payment,
}: {
  booking: BookingDocument;
  payment: PaymentDocument | null;
}) {
  const operationalState = getOperationalBookingState(booking, payment);
  const sla = formatSlaSummary(booking.requestResponse);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rezumat</CardTitle>
        <CardDescription>Situația programării, într-un format ușor de înțeles.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FieldValue label="Status operațional" value={operationalState} />
        <FieldValue label="Serviciu" value={getServiceName(booking)} />
        <FieldValue label="Început" value={formatAdminDateTime(booking.scheduledStartAt)} />
        <FieldValue label="Sfârșit" value={formatAdminDateTime(booking.scheduledEndAt)} />
        <FieldValue label="Formulă preț" value={formatPricingContext(booking)} />
        <FieldValue
          label="Răspuns prestator"
          value={<Badge variant={sla.variant}>{sla.label}</Badge>}
        />
        <FieldValue label="Detaliu răspuns" value={sla.detail} />
        <FieldValue
          label="Descriere cerere"
          value={formatValue(booking.requestDetails?.description)}
        />
        <FieldValue
          label="Profesioniști solicitați"
          value={String(booking.requestDetails?.professionalsCount ?? "-")}
        />
      </CardContent>
    </Card>
  );
}

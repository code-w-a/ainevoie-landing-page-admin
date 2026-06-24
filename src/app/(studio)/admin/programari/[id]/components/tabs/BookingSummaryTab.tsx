"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatAccessDetails,
  formatAddOnPrice,
  formatBookingTypeLabel,
  formatPricingContext,
  formatRequestNumber,
  formatServiceAddress,
  formatSlaSummary,
  formatValue,
  getBookingAddOns,
  getServiceLocation,
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
  const requestNumber = formatRequestNumber(booking);
  const addOns = getBookingAddOns(booking);
  const serviceLocation = getServiceLocation(booking);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rezumat</CardTitle>
        <CardDescription>Situația programării, într-un format ușor de înțeles.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FieldValue label="ID cerere" value={requestNumber || "-"} />
        <FieldValue label="Tip programare" value={formatBookingTypeLabel(booking)} />
        <FieldValue label="Status operațional" value={operationalState} />
        <FieldValue label="Serviciu" value={getServiceName(booking)} />
        <FieldValue label="Început" value={formatAdminDateTime(booking.scheduledStartAt)} />
        <FieldValue label="Sfârșit" value={formatAdminDateTime(booking.scheduledEndAt)} />
        <FieldValue label="Formulă preț" value={formatPricingContext(booking)} />
        <FieldValue label="Adresă serviciu" value={formatServiceAddress(booking)} />
        <FieldValue label="Număr stradal" value={formatValue(serviceLocation.streetNumber)} />
        <FieldValue label="Bloc" value={formatValue(serviceLocation.building)} />
        <FieldValue label="Detalii de acces" value={formatAccessDetails(booking)} />
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
        {addOns.length ? (
          <FieldValue
            label="Extra-servicii"
            value={
              <div className="flex flex-col gap-1">
                {addOns.map((addOn, index) => (
                  <span key={addOn.addOnId || `${addOn.key || "addon"}-${index}`}>
                    {formatValue(addOn.name)} · {formatAddOnPrice(addOn)}
                  </span>
                ))}
              </div>
            }
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

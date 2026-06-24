"use client";

import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  CreditCard,
  LifeBuoy,
  MessageSquare,
  Star,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatBookingAmount,
  formatBookingStatusLabel,
  formatBookingPaymentStatusLabel,
  formatBookingTypeLabel,
  formatRequestNumber,
  getBookingStatusVariant,
  getPaymentStatusVariant,
  getProviderDisplayName,
  getServiceName,
  getUserDisplayName,
  type BookingDocument,
  type PaymentDocument,
} from "@/lib/adminBookingDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function BookingDetailHeader({
  booking,
  payment,
  user,
  provider,
  conversationId,
  paymentLookupId,
  reviewId,
}: {
  booking: BookingDocument;
  payment: PaymentDocument | null;
  user?: Record<string, unknown> | null;
  provider?: Record<string, unknown> | null;
  conversationId: string;
  paymentLookupId: string;
  reviewId?: string | null;
}) {
  const userName = getUserDisplayName(booking, user);
  const providerName = getProviderDisplayName(booking, provider);
  const serviceName = getServiceName(booking);
  const paymentStatus = String(payment?.status || booking.paymentSummary?.status || "");
  const requestNumber = formatRequestNumber(booking);

  return (
    <Card>
      <CardContent className="p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/programari">
            <ChevronLeft className="h-4 w-4" />
            Înapoi la programări
          </Link>
        </Button>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {requestNumber ? (
                <span className="text-sm font-semibold text-muted-foreground">{requestNumber}</span>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight">{serviceName}</h1>
              <Badge variant={getBookingStatusVariant(booking.status)}>
                {formatBookingStatusLabel(booking.status)}
              </Badge>
              <Badge variant="outline">{formatBookingTypeLabel(booking)}</Badge>
              {paymentStatus && (
                <Badge variant={getPaymentStatusVariant(paymentStatus)}>
                  {formatBookingPaymentStatusLabel(paymentStatus)}
                </Badge>
              )}
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span>{formatAdminDateTime(booking.scheduledStartAt)}</span>
              </span>
              <span>
                Sumă: <span className="font-medium text-foreground">{formatBookingAmount(payment)}</span>
              </span>
              <span>
                Client: <span className="font-medium text-foreground">{userName}</span>
              </span>
              <span>
                Prestator: <span className="font-medium text-foreground">{providerName}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.userId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/utilizatori/${encodeURIComponent(String(booking.userId))}`}>
                  <UserRound className="h-4 w-4" />
                  Deschide client
                </Link>
              </Button>
            ) : null}
            {booking.providerId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/prestatori/${encodeURIComponent(String(booking.providerId))}`}>
                  <UserRound className="h-4 w-4" />
                  Deschide prestator
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/conversatii?conversationId=${encodeURIComponent(conversationId)}`}>
                <MessageSquare className="h-4 w-4" />
                Conversație
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/suport?q=${encodeURIComponent(String(booking.bookingId || ""))}`}>
                <LifeBuoy className="h-4 w-4" />
                Suport
              </Link>
            </Button>
            {paymentLookupId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/plati?q=${encodeURIComponent(paymentLookupId)}`}>
                  <CreditCard className="h-4 w-4" />
                  Plată
                </Link>
              </Button>
            ) : null}
            {reviewId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/recenzii?q=${encodeURIComponent(reviewId)}`}>
                  <Star className="h-4 w-4" />
                  Recenzie
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

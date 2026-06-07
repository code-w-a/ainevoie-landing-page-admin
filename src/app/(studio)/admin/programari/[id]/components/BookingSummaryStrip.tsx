"use client";

import { CalendarClock, CreditCard, LifeBuoy, MessageSquare, Timer } from "lucide-react";
import { SummaryStat } from "@/app/(studio)/admin/prestatori/[id]/components/shared/SummaryStat";
import type { BookingSummaryMetrics } from "@/lib/adminBookingDetail";

export function BookingSummaryStrip({ metrics }: { metrics: BookingSummaryMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryStat
        icon={CalendarClock}
        label="Status programare"
        value={metrics.bookingStatusLabel}
        detail={metrics.bookingDetail}
        variant={metrics.bookingStatusVariant}
      />
      <SummaryStat
        icon={CreditCard}
        label="Plată"
        value={metrics.paymentLabel}
        detail={metrics.paymentDetail}
        variant={metrics.paymentVariant}
      />
      <SummaryStat
        icon={MessageSquare}
        label="Conversație"
        value={metrics.conversationLabel}
        detail={metrics.conversationDetail}
        variant={metrics.conversationVariant}
      />
      <SummaryStat
        icon={LifeBuoy}
        label="Suport"
        value={metrics.supportLabel}
        detail={metrics.supportDetail}
        variant={metrics.supportVariant}
      />
      <SummaryStat
        icon={Timer}
        label="Răspuns prestator"
        value={metrics.providerResponseLabel}
        detail={metrics.providerResponseDetail}
        variant={metrics.providerResponseVariant}
      />
    </div>
  );
}

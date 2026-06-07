"use client";

import { CalendarClock, CreditCard, ShieldCheck, UserRound } from "lucide-react";
import { SummaryStat } from "@/app/(studio)/admin/prestatori/[id]/components/shared/SummaryStat";
import type { UserSummaryMetrics } from "@/lib/adminUserDetail";

export function UserSummaryStrip({ metrics }: { metrics: UserSummaryMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryStat
        icon={UserRound}
        label="Status cont"
        value={metrics.accountStatusLabel}
        detail={metrics.accountStatusLabel === "Activ" ? "Cont activ" : "Cont dezactivat"}
        variant={metrics.accountStatusVariant}
      />
      <SummaryStat
        icon={CalendarClock}
        label="Programări"
        value={String(metrics.bookingsCount)}
        detail={metrics.bookingsDetail}
        variant={metrics.bookingsCount > 0 ? "secondary" : "outline"}
      />
      <SummaryStat
        icon={CreditCard}
        label="Plăți"
        value={metrics.paymentsLabel}
        detail={metrics.paymentsDetail}
        variant={metrics.paymentsVariant}
      />
      <SummaryStat
        icon={ShieldCheck}
        label="Consimțăminte"
        value={metrics.consentsLabel}
        detail={metrics.consentsDetail}
        variant={metrics.consentsVariant}
      />
    </div>
  );
}

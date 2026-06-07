"use client";

import { BriefcaseBusiness, CalendarClock, Clock3, FileCheck2, Star } from "lucide-react";
import { getRatingSummary } from "@/lib/adminProviderDetail";
import { SummaryStat } from "./shared/SummaryStat";

export function ProviderSummaryStrip({
  activeServicesCount,
  identityOk,
  professionalOk,
  availabilityOk,
  recentBookingsCount,
  providerDirectory,
}: {
  activeServicesCount: number;
  identityOk: boolean;
  professionalOk: boolean;
  availabilityOk: boolean;
  recentBookingsCount: number;
  providerDirectory?: Record<string, unknown> | null;
}) {
  const documentsVerified = [identityOk, professionalOk].filter(Boolean).length;
  const ratingSummary = getRatingSummary(providerDirectory);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryStat
        icon={BriefcaseBusiness}
        label="Servicii"
        value={String(activeServicesCount)}
        detail={activeServicesCount > 0 ? "Servicii active" : "Fără servicii active"}
        variant={activeServicesCount > 0 ? "success" : "warning"}
      />
      <SummaryStat
        icon={FileCheck2}
        label="Documente"
        value={`${documentsVerified}/2`}
        detail={documentsVerified === 2 ? "Documente încărcate" : "Documente incomplete"}
        variant={documentsVerified === 2 ? "success" : "warning"}
      />
      <SummaryStat
        icon={Clock3}
        label="Program"
        value={availabilityOk ? "Configurat" : "Neconfigurat"}
        detail={availabilityOk ? "Program disponibil" : "Programul nu este setat"}
        variant={availabilityOk ? "success" : "warning"}
      />
      <SummaryStat
        icon={CalendarClock}
        label="Programări"
        value={String(recentBookingsCount)}
        detail={recentBookingsCount > 0 ? "Programări recente" : "Fără programări recente"}
        variant={recentBookingsCount > 0 ? "secondary" : "outline"}
      />
      <SummaryStat
        icon={Star}
        label="Rating"
        value={ratingSummary.label}
        detail={ratingSummary.detail}
        variant={ratingSummary.label === "Fără recenzii" ? "outline" : "success"}
      />
    </div>
  );
}

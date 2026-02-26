import { Badge } from "@/components/ui/badge";

const benefitChips = [
  "Înregistrare rapidă, fără drumuri",
  "Cont reutilizabil în aplicația mobilă",
  "Date validate de echipa AInevoie",
];

export default function ProviderOnboardingHero() {
  return (
    <div className="mx-auto mb-8 max-w-[860px] text-center sm:mb-10">
      <span className="text-primary mb-2 block text-base font-medium sm:mb-3 sm:text-lg">
        Pentru prestatori de servicii
      </span>
      <h1 className="mb-3 text-3xl font-bold text-black dark:text-white sm:mb-4 sm:text-4xl md:text-[44px] md:leading-tight">
        Intră în rețeaua AInevoie și primește clienți mai ușor
      </h1>
      <p className="text-body mx-auto max-w-[760px] text-sm sm:text-base">
        Completezi onboarding-ul în câțiva pași, iar contul tău este pregătit pentru activare.
        Datele se salvează în baza comună, astfel încât la lansare te autentifici direct în aplicație.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6">
        {benefitChips.map((chip) => (
          <Badge key={chip} variant="secondary" className="rounded-full px-3 py-1">
            {chip}
          </Badge>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">Durata estimată: ~2 minute</p>
    </div>
  );
}

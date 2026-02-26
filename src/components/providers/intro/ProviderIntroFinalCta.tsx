import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProviderIntroFinalCta() {
  return (
    <section className="pb-12 sm:pb-16">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-dark sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">
              Ești gata să intri în rețeaua AInevoie?
            </h3>
            <p className="text-body mt-1 text-sm sm:text-base">
              Completează acum formularul și finalizează înscrierea în doar câteva minute.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/providers/onboarding/form">Începe înscrierea</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

import { Badge } from "@/components/ui/badge";
import PhoneMockup from "@/components/PhoneMockup";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const miniBenefits = [
  {
    title: "Lead-uri mai clare",
    description: "Primești solicitări cu detalii complete, gata de procesat.",
  },
  {
    title: "Cont reutilizabil",
    description: "Te autentifici cu același cont în aplicația mobilă la lansare.",
  },
  {
    title: "Onboarding ghidat",
    description: "Finalizezi rapid pașii și știi exact ce urmează.",
  },
];

export default function ProviderIntroHero() {
  return (
    <section id="home" className="pt-[165px]">
      <div className="-mx-4 flex flex-wrap items-center">
        <div className="w-full px-4 lg:w-7/12">
          <div className="mb-12 lg:mb-0 lg:max-w-[570px]">
            <span className="mb-5 block text-lg leading-tight font-medium text-black sm:text-[22px] xl:text-[22px] dark:text-white">
              Pentru prestatori de servicii
            </span>
            <h1 className="mb-4 text-3xl leading-tight font-bold text-black sm:text-[40px] md:text-[50px] lg:text-[42px] xl:text-[50px] dark:text-white">
              De la <span className="bg-gradient-1 inline bg-clip-text text-transparent">profil</span> la comenzi.
            </h1>

            <p className="text-body mb-8 text-base leading-relaxed sm:text-[17px]">
              Îți creezi contul, completezi datele esențiale și intri în fluxul de activare.
              Totul se salvează în baza comună, gata pentru aplicația mobilă.
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {miniBenefits.map((item) => (
                <Badge key={item.title} variant="secondary" className="rounded-full px-3 py-1">
                  {item.title}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/providers/onboarding/form">Începe înscrierea</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#beneficii-prestatori">Vezi beneficiile</Link>
              </Button>
            </div>

            <p className="text-body mt-4 text-sm">
              Durată estimată ~2 minute • Date securizate • Confirmare pe email
            </p>
          </div>
        </div>

        <div className="w-full px-4 lg:w-5/12">
          <div className="relative z-10 mx-auto w-full max-w-[530px] pt-8 lg:mr-0">
            <PhoneMockup
              src="/images/screenshots/Prestator_calendar.jpg"
              alt="Calendarul prestatorului în aplicația AInevoie"
              priority={true}
              sizes="(min-width: 1280px) 360px, (min-width: 1024px) 320px, 280px"
            />
            <div className="bg-gradient-1 absolute inset-x-0 top-0 -z-10 mx-auto aspect-square w-full rounded-full opacity-80" />

            <Badge className="absolute -left-2 top-7 rounded-full px-3 py-1 text-xs">
              Cont gata pentru lansare
            </Badge>
            <Badge className="absolute -right-2 top-1/2 rounded-full px-3 py-1 text-xs">
              Date în baza comună
            </Badge>
            <Badge className="absolute left-6 bottom-4 rounded-full px-3 py-1 text-xs">
              Activare asistată
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

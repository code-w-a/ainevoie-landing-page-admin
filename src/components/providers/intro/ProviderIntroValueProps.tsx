import { CalendarCheck, ClipboardCheck, Compass, Handshake, ShieldCheck, Sparkles } from "lucide-react";

const valueProps = [
  {
    title: "Vizibilitate mai bună",
    description: "Profilul tău intră în fluxul de selecție al clienților.",
    Icon: Compass,
  },
  {
    title: "Timp economisit",
    description: "Primești cereri mai clare, cu date esențiale din start.",
    Icon: ClipboardCheck,
  },
  {
    title: "Program mai predictibil",
    description: "Organizezi comenzile mai ușor, cu mai puține clarificări.",
    Icon: CalendarCheck,
  },
  {
    title: "Încredere pentru clienți",
    description: "Datele validate cresc credibilitatea profilului tău.",
    Icon: ShieldCheck,
  },
  {
    title: "Pornire simplă",
    description: "Onboarding rapid, fără pași complicați sau procese greoaie.",
    Icon: Sparkles,
  },
  {
    title: "Relație directă cu echipa",
    description: "Primești suport dacă lipsesc informații la activare.",
    Icon: Handshake,
  },
];

export default function ProviderIntroValueProps() {
  return (
    <section id="beneficii-prestatori" className="pt-12 sm:pt-16">
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
          Tot ce îți trebuie pentru a lucra eficient ca prestator
        </h2>
        <p className="text-body text-sm sm:text-base">
          AInevoie simplifică activarea și gestionarea comenzilor dintr-un singur flux.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-white px-5 pb-10 pt-10 shadow-card dark:bg-dark dark:shadow-card-dark sm:px-8 sm:pt-12">
        <div className="-mx-4 flex flex-wrap">
          {valueProps.map((item) => (
            <div key={item.title} className="w-full px-4 md:w-1/2 lg:w-1/3">
              <article className="group mx-auto mb-9 max-w-[310px] text-center">
                <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-gray text-primary duration-300 group-hover:bg-primary group-hover:text-white dark:bg-[#2A2E44] dark:text-white dark:group-hover:bg-primary">
                  <item.Icon className="h-9 w-9" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-black dark:text-white sm:text-[22px]">
                  {item.title}
                </h3>
                <p className="text-body text-base">{item.description}</p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

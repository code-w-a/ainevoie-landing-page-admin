import { BadgeCheck, MailCheck, UserRoundPlus } from "lucide-react";

const steps = [
  {
    title: "Completezi datele",
    description: "Introduci rapid informațiile de contact și serviciile oferite.",
    Icon: UserRoundPlus,
  },
  {
    title: "Primești confirmare pe email",
    description: "După trimitere, primești confirmarea și pașii următori.",
    Icon: MailCheck,
  },
  {
    title: "Validăm profilul și pregătim activarea",
    description: "Echipa AInevoie verifică datele și te contactează la nevoie.",
    Icon: BadgeCheck,
  },
];

export default function ProviderIntroSteps() {
  return (
    <section id="steps" className="py-12 sm:py-16">
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
          Cum funcționează
        </h2>
        <p className="text-body text-sm sm:text-base">
          Un flow simplu, în 3 pași, până la activare.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-dark sm:p-6"
          >
            <div className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
              <step.Icon className="h-5 w-5" />
            </div>
            <p className="text-primary mb-2 text-xs font-semibold">PAS {index + 1}</p>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">{step.title}</h3>
            <p className="text-body text-sm">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

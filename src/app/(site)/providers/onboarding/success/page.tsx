import Link from "next/link";
import { CheckCircle2, CircleHelp, MailCheck, ShieldCheck } from "lucide-react";

const nextSteps = [
  {
    title: "Verifică emailul",
    description:
      "Ai primit mesajul de bun venit. Dacă nu îl vezi imediat, verifică și folderul Spam/Promotions.",
    Icon: MailCheck,
  },
  {
    title: "Echipa validează datele",
    description:
      "Verificăm profilul trimis. Dacă lipsește ceva, te contactăm rapid pe email sau telefon.",
    Icon: ShieldCheck,
  },
  {
    title: "Te pregătim pentru lansare",
    description:
      "Contul creat acum rămâne activ și va putea fi folosit direct în aplicația mobilă la lansare.",
    Icon: CheckCircle2,
  },
];

export default function ProviderOnboardingSuccessPage() {
  return (
    <main className="pb-24 pt-[160px]">
      <section className="container max-w-[1100px]">
        <div className="mx-auto max-w-[820px] rounded-2xl bg-white p-8 text-center shadow-card dark:bg-dark dark:shadow-card-dark sm:p-10">
          <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-primary h-10 w-10" />
          </div>
          <span className="text-primary mb-3 block text-lg font-medium">Onboarding finalizat</span>
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl">
            Contul tău de prestator a fost creat cu succes
          </h1>
          <p className="text-body mx-auto max-w-[680px] text-base">
            Datele tale au fost salvate în baza comună AInevoie. În continuare, noi validăm profilul
            și revenim cu orice pas suplimentar necesar.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {nextSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl bg-white p-6 shadow-card dark:bg-dark dark:shadow-card-dark"
            >
              <div className="bg-primary/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                <step.Icon className="text-primary h-5 w-5" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">{step.title}</h2>
              <p className="text-body text-sm">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-card dark:bg-dark dark:shadow-card-dark">
          <div className="flex flex-wrap items-start gap-3">
            <CircleHelp className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">Ai nevoie de ajutor?</h3>
              <p className="text-body text-sm">
                Dacă ai întrebări despre PFA/SRL, documente sau activare, ne poți scrie la{" "}
                <a href="mailto:contact@ainevoie.ro" className="text-primary hover:underline">
                  contact@ainevoie.ro
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-primary hover:bg-primary/90 inline-flex rounded-md px-6 py-3 text-sm font-medium text-white"
          >
            Înapoi la homepage
          </Link>
          <Link
            href="/providers/onboarding/form"
            className="border-stroke dark:border-stroke-dark hover:border-primary inline-flex rounded-md border px-6 py-3 text-sm font-medium text-black dark:text-white"
          >
            Înregistrează alt prestator
          </Link>
        </div>
      </section>
    </main>
  );
}

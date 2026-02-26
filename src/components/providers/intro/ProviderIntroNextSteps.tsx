import { CheckCircle2 } from "lucide-react";

const items = [
  "Contul tău este creat și salvat în baza comună.",
  "Primești email de bun venit cu următorii pași.",
  "Echipa AiNevoie verifică profilul și te contactează dacă lipsesc detalii.",
];

export default function ProviderIntroNextSteps() {
  return (
    <section className="py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-dark sm:p-8">
        <h2 className="mb-4 text-2xl font-bold text-black dark:text-white sm:text-3xl">
          Ce urmează după înscriere
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-body text-sm sm:text-base">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

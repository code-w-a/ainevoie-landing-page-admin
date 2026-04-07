import { LegalMarkdown } from "@/components/Legal/LegalMarkdown";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("gdprMetaTitle"),
    description: t("gdprMetaDescription"),
  };
}

export default async function GDPRPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const tLegal = await getTranslations({ locale, namespace: "Legal" });

  if (locale === "en") {
    return (
      <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
        <div className="container overflow-hidden lg:max-w-[1250px]">
          <div className="wow fadeInUp" data-wow-delay=".2s">
            <h1 className="mb-8 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px]">
              {tLegal("gdprTitle")}
            </h1>
            <LegalMarkdown slug="gdpr" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
      <div className="container overflow-hidden lg:max-w-[1250px]">
        <div className="wow fadeInUp" data-wow-delay=".2s">
          <h1 className="mb-8 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px]">
            Drepturile tale GDPR
          </h1>

          <div className="space-y-8 text-base text-body">
            <section>
              <p className="mb-4">
                <strong>Data ultimei actualizări:</strong> 30 ianuarie 2026
              </p>
              <p>
                În conformitate cu Regulamentul General privind Protecția Datelor
                (GDPR), ai o serie de drepturi în ceea ce privește datele tale
                personale. Această pagină explică fiecare drept și cum îl poți
                exercita.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                1. Drepturile tale
              </h2>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.1. Dreptul de acces (Art. 15 GDPR)
              </h3>
              <p>
                Ai dreptul să primești o copie a datelor personale pe care le
                prelucrăm despre tine, precum și informații despre:
              </p>
              <ul className="list-disc space-y-2 pl-6 mt-3">
                <li>Scopul prelucrării</li>
                <li>Categoriile de date personale</li>
                <li>Destinatarii datelor</li>
                <li>Perioada de stocare</li>
                <li>Drepturile tale (rectificare, ștergere etc.)</li>
              </ul>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.2. Dreptul la rectificare (Art. 16 GDPR)
              </h3>
              <p>
                Dacă datele tale sunt incorecte sau incomplete, ai dreptul să le
                corectezi. Poți actualiza majoritatea datelor direct din contul
                tău (secțiunea Setări / Profil).
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.3. Dreptul la ștergere / &bdquo;Dreptul de a fi uitat&rdquo;
                (Art. 17 GDPR)
              </h3>
              <p className="mb-3">
                Poți solicita ștergerea datelor tale în următoarele situații:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Datele nu mai sunt necesare pentru scopul inițial</li>
                <li>
                  Îți retragi consimțământul și nu există altă bază legală pentru
                  prelucrare
                </li>
                <li>Te opui prelucrării și nu există motive legitime superioare</li>
                <li>Datele au fost prelucrate ilegal</li>
                <li>Există o obligație legală de ștergere</li>
              </ul>
              <p className="mt-3">
                <strong>Excepții:</strong> Nu putem șterge datele dacă sunt
                necesare pentru respectarea unei obligații legale (ex: documente
                fiscale) sau pentru constatarea, exercitarea sau apărarea unor
                drepturi în instanță.
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.4. Dreptul la portabilitatea datelor (Art. 20 GDPR)
              </h3>
              <p>
                Ai dreptul să primești datele tale într-un format structurat,
                utilizat în mod curent și care poate fi citit automat (ex: JSON,
                CSV), astfel încât să le poți transfera la alt furnizor de
                servicii.
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.5. Dreptul la restricționarea prelucrării (Art. 18 GDPR)
              </h3>
              <p className="mb-3">
                Poți solicita restricționarea prelucrării în următoarele cazuri:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Contestă acuratețea datelor (până la verificare)</li>
                <li>
                  Prelucrarea este ilegală, dar nu vrei ștergerea datelor
                </li>
                <li>
                  Avem nevoie de date pentru constatarea/apărarea unor drepturi
                </li>
                <li>
                  Te-ai opus prelucrării și aștepți verificarea motivelor
                  legitime
                </li>
              </ul>
              <p className="mt-3">
                Când prelucrarea este restricționată, datele tale vor fi doar
                stocate, nu și prelucrate activ.
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.6. Dreptul la opoziție (Art. 21 GDPR)
              </h3>
              <p>
                Te poți opune prelucrării datelor tale în anumite situații, de
                exemplu:
              </p>
              <ul className="list-disc space-y-2 pl-6 mt-3">
                <li>
                  Prelucrare bazată pe interese legitime (trebuie să avem motive
                  imperative pentru a continua)
                </li>
                <li>
                  Marketing direct (poți refuza în orice moment, iar prelucrarea
                  va înceta imediat)
                </li>
              </ul>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                1.7. Dreptul de a nu face obiectul unei decizii bazate exclusiv
                pe prelucrare automată (Art. 22 GDPR)
              </h3>
              <p>
                Ai dreptul să nu fii supus unei decizii bazate exclusiv pe
                prelucrare automată (inclusiv profilare) care produce efecte
                juridice sau te afectează semnificativ. În cazul nostru, deciziile
                importante (acceptare programări, suspendare cont) sunt luate cu
                intervenție umană.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                2. Cum îți poți exercita drepturile
              </h2>
              <p className="mb-4">
                Pentru a-ți exercita orice drept GDPR, ne poți contacta prin:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:contact@ainevoie.ro"
                    className="text-primary hover:underline"
                  >
                    contact@ainevoie.ro
                  </a>{" "}
                  (menționează în subiect &bdquo;Cerere GDPR&rdquo;)
                </li>
                <li>
                  <strong>Formular contact:</strong>{" "}
                  <Link href="/#support" className="text-primary hover:underline">
                    Contact
                  </Link>
                </li>
                <li>
                  <strong>Setări cont:</strong> pentru rectificare și ștergere
                  directă (dacă aplicabil)
                </li>
              </ul>
              <p className="mt-4">
                <strong>Ce trebuie să incluzi în cerere:</strong>
              </p>
              <ul className="list-disc space-y-2 pl-6 mt-3">
                <li>Numele complet</li>
                <li>Adresa de email asociată contului</li>
                <li>Descrierea dreptului pe care vrei să-l exerciți</li>
                <li>
                  Orice informații suplimentare care ne ajută să identificăm
                  datele tale
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                3. Termene de răspuns
              </h2>
              <p>
                Vom răspunde cererii tale în termen de <strong>30 de zile</strong>{" "}
                calendaristice de la primire. În cazuri complexe, putem prelungi
                termenul cu încă 60 de zile, dar te vom informa despre întârziere
                și motive în primele 30 de zile.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                4. Verificarea identității
              </h2>
              <p>
                Pentru a preveni accesul neautorizat la datele tale, s-ar putea să
                îți cerem să confirmi identitatea înainte de a procesa cererea
                (ex: verificare prin email sau întrebări suplimentare).
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                5. Taxe
              </h2>
              <p>
                În general, exercitarea drepturilor GDPR este <strong>gratuită</strong>.
                Cu toate acestea, dacă cererile sunt în mod vădit nefondate, repetitive
                sau excesive, ne rezervăm dreptul de a percepe o taxă rezonabilă
                sau de a refuza cererea.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                6. Reclamații la autoritatea de supraveghere
              </h2>
              <p>
                Dacă consideri că drepturile tale GDPR au fost încălcate, ai
                dreptul de a depune o plângere la:
              </p>
              <p className="mt-4">
                <strong>
                  Autoritatea Națională de Supraveghere a Prelucrării Datelor cu
                  Caracter Personal (ANSPDCP)
                </strong>
                <br />
                Website:{" "}
                <a
                  href="https://www.dataprotection.ro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.dataprotection.ro
                </a>
                <br />
                Adresă: B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București
                <br />
                Telefon: +40 318 059 211 / +40 318 059 212
                <br />
                Email:{" "}
                <a
                  href="mailto:anspdcp@dataprotection.ro"
                  className="text-primary hover:underline"
                >
                  anspdcp@dataprotection.ro
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                7. Contact
              </h2>
              <p>
                Pentru orice întrebări despre drepturile tale sau despre cum
                prelucrăm datele personale, consultă{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Politica de confidențialitate
                </Link>{" "}
                sau contactează-ne:
              </p>
              <p className="mt-4">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:contact@ainevoie.ro"
                  className="text-primary hover:underline"
                >
                  contact@ainevoie.ro
                </a>
                <br />
                <strong>Adresă:</strong> [Adresă operator]
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

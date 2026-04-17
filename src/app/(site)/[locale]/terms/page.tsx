import { LegalMarkdown } from "@/components/Legal/LegalMarkdown";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo";
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
  return buildLocalePageMetadata(locale, "/terms", {
    title: t("termsMetaTitle"),
    description: t("termsMetaDescription"),
  });
}

export default async function TermsPage({ params }: PageProps) {
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
              {tLegal("termsTitle")}
            </h1>
            <LegalMarkdown slug="terms" />
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
            Termeni și condiții
          </h1>

          <div className="space-y-8 text-base text-body">
            <section>
              <p className="mb-4">
                <strong>Data ultimei actualizări:</strong> 30 ianuarie 2026
              </p>
              <p>
                Bine ai venit la AInevoie! Acești Termeni și Condiții
                (&bdquo;Termeni&rdquo;) reglementează utilizarea platformei
                AInevoie (&bdquo;Platforma&rdquo;, &bdquo;Serviciul&rdquo;), un
                marketplace care conectează clienții cu furnizorii de servicii
                de curățenie și servicii conexe.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                1. Acceptarea termenilor
              </h2>
              <p>
                Prin accesarea și utilizarea Platformei, confirmi că ai citit,
                înțeles și accepți acești Termeni, precum și{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Politica de confidențialitate
                </Link>
                . Dacă nu ești de acord, te rugăm să nu folosești Serviciul.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                2. Descrierea serviciului
              </h2>
              <p className="mb-4">
                AInevoie este o platformă de tip marketplace care facilitează
                conectarea între:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Clienți:</strong> utilizatori care caută servicii de
                  curățenie sau servicii conexe
                </li>
                <li>
                  <strong>Furnizori:</strong> companii sau profesioniști care
                  oferă servicii de curățenie
                </li>
              </ul>
              <p className="mt-4">
                AInevoie nu prestează direct serviciile de curățenie, ci
                facilitează comunicarea, programarea și plata între părți.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                3. Eligibilitate
              </h2>
              <p>
                Pentru a folosi Platforma, trebuie să ai cel puțin 18 ani sau să
                acționezi în numele unei entități juridice autorizate. Prin
                înregistrare, declari că informațiile furnizate sunt corecte și
                complete.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                4. Contul tău
              </h2>
              <p className="mb-4">
                Pentru a accesa anumite funcționalități, trebuie să creezi un
                cont. Ești responsabil pentru:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Menținerea confidențialității parolei</li>
                <li>
                  Toate activitățile care au loc sub contul tău (dacă suspectezi
                  o breșă de securitate, anunță-ne imediat)
                </li>
                <li>
                  Furnizarea de informații corecte și actualizarea lor când este
                  necesar
                </li>
              </ul>
              <p className="mt-4">
                Ne rezervăm dreptul de a suspenda sau închide conturile care
                încalcă acești Termeni.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                5. Roluri și responsabilități
              </h2>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                5.1. Pentru clienți
              </h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Poți căuta, compara și contacta furnizorii prin Platformă
                </li>
                <li>
                  Ești responsabil pentru acordurile directe cu furnizorii
                  (detalii serviciu, preț, orar)
                </li>
                <li>
                  Trebuie să lași evaluări corecte și constructive după
                  finalizarea serviciului
                </li>
              </ul>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                5.2. Pentru furnizori
              </h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Trebuie să deții autorizațiile și asigurările necesare pentru
                  prestarea serviciilor
                </li>
                <li>
                  Ești responsabil pentru calitatea serviciilor oferite și pentru
                  respectarea programărilor
                </li>
                <li>
                  Informațiile din profilul tău (servicii, tarife, zone) trebuie
                  să fie corecte și actualizate
                </li>
                <li>
                  Recenziile negative pot afecta vizibilitatea și reputația ta pe
                  Platformă
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                6. Programări și anulări
              </h2>
              <p className="mb-4">
                Programările se fac prin Platformă. Atât clienții, cât și
                furnizorii pot anula sau reprograma conform politicilor afișate
                în aplicație. Anulările târzii sau absențele repetate pot duce
                la restricții pe cont.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                7. Plăți
              </h2>
              <p className="mb-4">
                Plățile (acolo unde sunt disponibile în Platformă) sunt procesate
                prin Stripe, un furnizor terț. AInevoie nu stochează informații
                de card. Termenii și Condițiile Stripe se aplică pentru orice
                tranzacție. Furnizorii pot fi taxați cu un comision de platformă
                conform planului ales.
              </p>
              <p>
                Pentru detalii despre planuri și tarife, consultă secțiunea{" "}
                <Link href="/#pricing" className="text-primary hover:underline">
                  Planuri
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                8. Recenzii și evaluări
              </h2>
              <p>
                După finalizarea unui serviciu, clienții pot lăsa recenzii și
                evaluări. Aceste recenzii trebuie să fie oneste, relevante și să
                nu conțină limbaj ofensator sau discriminatoriu. Ne rezervăm
                dreptul de a modera sau șterge recenziile care încalcă aceste
                reguli.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                9. Proprietate intelectuală
              </h2>
              <p>
                Toate materialele de pe Platformă (logo, design, texte, imagini,
                cod sursă) sunt proprietatea AInevoie sau a licențiatorilor săi
                și sunt protejate de legile privind drepturile de autor. Nu poți
                reproduce, distribui sau modifica aceste materiale fără
                permisiune scrisă.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                10. Utilizare interzisă
              </h2>
              <p className="mb-4">
                Este interzis să folosești Platforma pentru:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Activități ilegale sau care încalcă drepturile terților
                </li>
                <li>Spam, phishing sau transmiterea de malware</li>
                <li>
                  Manipularea evaluărilor (recenzii false, cumpărarea de rating)
                </li>
                <li>
                  Colectarea datelor altor utilizatori fără consimțământul lor
                </li>
                <li>
                  Încercări de a ocoli securitatea Platformei sau a accesa
                  conturi ale altor utilizatori
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                11. Limitări de răspundere
              </h2>
              <p className="mb-4">
                AInevoie acționează ca intermediar între clienți și furnizori.
                Nu suntem responsabili pentru:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Calitatea, siguranța sau legalitatea serviciilor oferite</li>
                <li>
                  Acuratețea informațiilor furnizate de utilizatori (profiluri,
                  recenzii)
                </li>
                <li>
                  Dispute între clienți și furnizori (vă încurajăm să rezolvați
                  direct sau să apelați la autorități)
                </li>
                <li>
                  Pierderi sau daune rezultate din utilizarea Platformei (în
                  limita permisă de lege)
                </li>
              </ul>
              <p className="mt-4">
                Platforma este furnizată &bdquo;ca atare&rdquo;, fără garanții
                implicite sau explicite.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                12. Suspendare și închidere cont
              </h2>
              <p>
                Ne rezervăm dreptul de a suspenda sau închide conturile care
                încalcă acești Termeni, fără notificare prealabilă, în cazuri de
                abuz grav. Utilizatorii pot solicita ștergerea contului prin
                secțiunea de setări sau contactându-ne la{" "}
                <a
                  href="mailto:contact@ai-nevoie.ro"
                  className="text-primary hover:underline"
                >
                  contact@ai-nevoie.ro
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                13. Modificări ale termenilor
              </h2>
              <p>
                Ne rezervăm dreptul de a modifica acești Termeni în orice moment.
                Modificările semnificative vor fi comunicate prin email sau prin
                banner pe Platformă. Continuarea utilizării după modificări
                constituie acceptarea noilor Termeni.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                14. Legea aplicabilă și soluționarea litigiilor
              </h2>
              <p>
                Acești Termeni sunt guvernați de legile României. Orice litigiu
                va fi soluționat de instanțele competente din România. Înainte de
                a apela la instanță, încurajăm rezolvarea amiabilă prin
                comunicare directă.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                15. Contact
              </h2>
              <p>
                Pentru orice întrebări privind acești Termeni, ne poți contacta:
              </p>
              <p className="mt-4">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:contact@ai-nevoie.ro"
                  className="text-primary hover:underline"
                >
                  contact@ai-nevoie.ro
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

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de confidențialitate | AInevoie",
  description:
    "Cum colectăm, folosim și protejăm datele tale personale în conformitate cu GDPR.",
};

const PrivacyPage = () => {
  return (
    <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
      <div className="container overflow-hidden lg:max-w-[1250px]">
        <div className="wow fadeInUp" data-wow-delay=".2s">
          <h1 className="mb-8 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px]">
            Politica de confidențialitate
          </h1>

          <div className="space-y-8 text-base text-body">
            <section>
              <p className="mb-4">
                <strong>Data ultimei actualizări:</strong> 30 ianuarie 2026
              </p>
              <p>
                AInevoie (&bdquo;noi&rdquo;, &bdquo;al nostru&rdquo;) respectă
                confidențialitatea datelor tale personale și se angajează să le
                protejeze în conformitate cu Regulamentul General privind
                Protecția Datelor (GDPR) și legislația română aplicabilă.
              </p>
              <p className="mt-4">
                <strong>Operator de date:</strong> [Denumire entitate juridică]
                <br />
                <strong>Contact DPO:</strong>{" "}
                <a
                  href="mailto:contact@ainevoie.ro"
                  className="text-primary hover:underline"
                >
                  contact@ainevoie.ro
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                1. Ce date colectăm
              </h2>
              <p className="mb-4">Colectăm următoarele categorii de date:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Date de identificare:</strong> nume, prenume, adresă
                  email, număr de telefon (opțional)
                </li>
                <li>
                  <strong>Date de cont:</strong> parolă (criptată), tip de cont
                  (client/furnizor)
                </li>
                <li>
                  <strong>Date despre servicii:</strong> programări, cereri,
                  recenzii și evaluări
                </li>
                <li>
                  <strong>Date de plată:</strong> informații procesate de Stripe
                  (nu stocăm datele cardului tău)
                </li>
                <li>
                  <strong>Date de newsletter:</strong> adresă email (gestionate
                  prin Mailchimp)
                </li>
                <li>
                  <strong>Date tehnice:</strong> adresă IP, tip browser,
                  cookie-uri (vezi{" "}
                  <Link
                    href="/cookies"
                    className="text-primary hover:underline"
                  >
                    Politica de cookies
                  </Link>
                  )
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                2. Scopul prelucrării datelor
              </h2>
              <p className="mb-4">
                Folosim datele tale personale pentru următoarele scopuri:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Crearea și gestionarea contului tău</li>
                <li>
                  Facilitarea conectării între clienți și furnizori de servicii
                </li>
                <li>Procesarea programărilor și plăților</li>
                <li>Comunicare privind serviciile solicitate</li>
                <li>
                  Trimiterea de newsletter și update-uri despre lansare (cu
                  consimțământul tău)
                </li>
                <li>
                  Îmbunătățirea platformei și a experienței utilizatorului
                </li>
                <li>Respectarea obligațiilor legale</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                3. Baza legală pentru prelucrare
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Consimțământ:</strong> pentru newsletter și
                  cookie-uri non-esențiale
                </li>
                <li>
                  <strong>Contract:</strong> pentru prestarea serviciilor
                  marketplace
                </li>
                <li>
                  <strong>Interes legitim:</strong> pentru îmbunătățirea
                  platformei și prevenirea fraudelor
                </li>
                <li>
                  <strong>Obligație legală:</strong> pentru raportări fiscale și
                  juridice
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                4. Drepturile tale GDPR
              </h2>
              <p className="mb-4">
                În conformitate cu GDPR, ai următoarele drepturi:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Dreptul de acces:</strong> poți solicita o copie a
                  datelor tale
                </li>
                <li>
                  <strong>Dreptul la rectificare:</strong> poți corecta datele
                  incorecte
                </li>
                <li>
                  <strong>Dreptul la ștergere:</strong> poți solicita ștergerea
                  datelor (&bdquo;dreptul de a fi uitat&rdquo;)
                </li>
                <li>
                  <strong>Dreptul la portabilitate:</strong> poți primi datele
                  într-un format structurat
                </li>
                <li>
                  <strong>Dreptul la restricționare:</strong> poți solicita
                  limitarea prelucrării
                </li>
                <li>
                  <strong>Dreptul la opoziție:</strong> poți obiecta la anumite
                  prelucrări
                </li>
              </ul>
              <p className="mt-4">
                Pentru detalii despre cum îți poți exercita aceste drepturi,
                consultă pagina{" "}
                <Link href="/gdpr" className="text-primary hover:underline">
                  Drepturile tale GDPR
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                5. Păstrarea și ștergerea datelor
              </h2>
              <p className="mb-4">Păstrăm datele tale cât timp:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Ai un cont activ pe platformă</li>
                <li>Este necesar pentru îndeplinirea obligațiilor contractuale</li>
                <li>
                  Este necesar conform legislației (ex: documente fiscale — 10
                  ani)
                </li>
              </ul>
              <p className="mt-4">
                După ștergerea contului, datele tale vor fi anonimizate sau
                șterse în termen de 30 de zile, cu excepția celor care trebuie
                păstrate pentru conformitate legală.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                6. Securitatea datelor
              </h2>
              <p>
                Implementăm măsuri tehnice și organizatorice pentru protejarea
                datelor tale: criptare SSL/TLS, parolele sunt hashate, accesul
                restricționat la date, backup-uri regulate. Cu toate acestea,
                nicio metodă de transmisie pe internet nu este 100% sigură.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                7. Partajarea datelor cu terțe părți
              </h2>
              <p className="mb-4">
                Nu vindem datele tale. Le partajăm doar cu:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Stripe:</strong> pentru procesarea plăților (conform
                  politicii Stripe)
                </li>
                <li>
                  <strong>Mailchimp:</strong> pentru gestionarea newsletter-ului
                  (conform politicii Mailchimp)
                </li>
                <li>
                  <strong>Furnizori de hosting:</strong> pentru stocarea datelor
                </li>
                <li>
                  <strong>Autorități:</strong> dacă ne este impus legal
                </li>
              </ul>
              <p className="mt-4">
                Toți partenerii noștri sunt obligați contractual să respecte
                GDPR.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                8. Cookie-uri
              </h2>
              <p>
                Folosim cookie-uri pentru funcționarea platformei și
                îmbunătățirea experienței tale. Pentru detalii, vezi{" "}
                <Link href="/cookies" className="text-primary hover:underline">
                  Politica de cookies
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                9. Modificări ale politicii
              </h2>
              <p>
                Ne rezervăm dreptul de a actualiza această politică. Vei fi
                notificat prin email sau prin banner pe platformă în cazul
                modificărilor semnificative.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                10. Contact
              </h2>
              <p>
                Pentru orice întrebări privind datele tale personale, ne poți
                contacta:
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
              <p className="mt-4">
                Poți depune o plângere la Autoritatea Națională de Supraveghere
                a Prelucrării Datelor cu Caracter Personal (ANSPDCP):{" "}
                <a
                  href="https://www.dataprotection.ro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.dataprotection.ro
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPage;

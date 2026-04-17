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
  return buildLocalePageMetadata(locale, "/cookies", {
    title: t("cookiesMetaTitle"),
    description: t("cookiesMetaDescription"),
  });
}

export default async function CookiesPage({ params }: PageProps) {
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
              {tLegal("cookiesTitle")}
            </h1>
            <LegalMarkdown slug="cookies" />
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
            Politica de cookies
          </h1>

          <div className="space-y-8 text-base text-body">
            <section>
              <p className="mb-4">
                <strong>Data ultimei actualizări:</strong> 30 ianuarie 2026
              </p>
              <p>
                Această politică explică ce sunt cookie-urile, cum le folosim pe
                AInevoie și cum le poți controla.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                1. Ce sunt cookie-urile?
              </h2>
              <p>
                Cookie-urile sunt fișiere text mici stocate pe dispozitivul tău
                (calculator, telefon, tabletă) când vizitezi un site web.
                Cookie-urile ajută site-ul să își amintească informații despre
                vizita ta (preferințe, autentificare, limba), pentru a-ți
                îmbunătăți experiența.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                2. Ce cookie-uri folosim
              </h2>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                2.1. Cookie-uri esențiale (strict necesare)
              </h3>
              <p className="mb-4">
                Aceste cookie-uri sunt necesare pentru funcționarea de bază a
                Platformei. Fără ele, nu poți folosi funcționalități precum
                autentificarea sau gestionarea sesiunii.
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Cookie-uri de sesiune:</strong> păstrează sesiunea ta
                  activă cât timp folosești site-ul
                </li>
                <li>
                  <strong>Cookie-uri de autentificare:</strong> țin evidența
                  stării de autentificare (login)
                </li>
                <li>
                  <strong>Cookie-uri de securitate:</strong> protejează
                  împotriva atacurilor CSRF și altor vulnerabilități
                </li>
              </ul>
              <p className="mt-4 text-sm italic">
                Aceste cookie-uri nu pot fi dezactivate fără a afecta
                funcționarea site-ului.
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                2.2. Cookie-uri de preferințe
              </h3>
              <p>
                Aceste cookie-uri rețin alegerile tale (ex: mod întuneric/luminos,
                limba) pentru a-ți personaliza experiența.
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                2.3. Cookie-uri de analiză (dacă sunt activate)
              </h3>
              <p>
                Folosim cookie-uri de analiză (ex: Google Analytics) pentru a
                înțelege cum interacționezi cu Platforma: ce pagini vizitezi,
                cât timp petreci, de unde vii. Aceste date sunt anonimizate și ne
                ajută să îmbunătățim site-ul.
              </p>

              <h3 className="mb-3 mt-6 text-xl font-semibold text-black dark:text-white">
                2.4. Cookie-uri terțe părți
              </h3>
              <p className="mb-4">
                Unele servicii pe care le folosim pot seta propriile cookie-uri:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Stripe:</strong> pentru procesarea plăților (vezi{" "}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Politica Stripe
                  </a>
                  )
                </li>
                <li>
                  <strong>Mailchimp:</strong> pentru newsletter (vezi{" "}
                  <a
                    href="https://mailchimp.com/legal/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Politica Mailchimp
                  </a>
                  )
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                3. Durata cookie-urilor
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Cookie-uri de sesiune:</strong> sunt șterse când
                  închizi browser-ul
                </li>
                <li>
                  <strong>Cookie-uri persistente:</strong> rămân pe dispozitiv
                  pentru o perioadă definită (ex: 30 zile, 1 an), apoi expiră
                  automat
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                4. Cum poți controla cookie-urile
              </h2>
              <p className="mb-4">
                Ai control complet asupra cookie-urilor. Poți:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Accepta toate cookie-urile:</strong> pentru
                  funcționalitate completă
                </li>
                <li>
                  <strong>Refuza cookie-uri non-esențiale:</strong> vei avea
                  acces la funcționalitatea de bază, dar experiența poate fi
                  limitată
                </li>
                <li>
                  <strong>Gestiona cookie-uri din browser:</strong> poți șterge
                  sau bloca cookie-uri din setările browser-ului tău (Chrome,
                  Firefox, Safari, Edge)
                </li>
              </ul>
              <p className="mt-4">
                <strong>Atenție:</strong> Dezactivarea cookie-urilor esențiale
                poate împiedica accesul la funcționalități precum autentificarea
                sau gestionarea programărilor.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                5. Linkuri utile pentru gestionarea cookie-urilor
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                6. Modificări ale politicii
              </h2>
              <p>
                Ne rezervăm dreptul de a actualiza această politică. Modificările
                semnificative vor fi comunicate pe site.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                7. Contact
              </h2>
              <p>
                Pentru întrebări despre cookie-uri sau despre cum îți folosim
                datele, consultă{" "}
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
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

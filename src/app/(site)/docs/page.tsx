import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ghid AInevoie",
  description:
    "Ghid scurt despre cum folosești AInevoie: pentru clienți și pentru firmele de curățenie.",
  // other metadata
};

export default function DocsPage() {
  return (
    <article>
      <h1>Ghid AInevoie</h1>

      <p className="text-body-color dark:text-body-color-dark text-base">
        AInevoie este o platformă care te ajută să conectezi rapid cererea cu
        oferta: clienții găsesc o firmă de curățenie potrivită, iar furnizorii
        primesc solicitări relevante și își gestionează programările mai ușor.
      </p>
      <p className="text-body-color dark:text-body-color-dark text-base">
        În aplicație poți: căuta și filtra firme, vedea profiluri și recenzii,
        trimite solicitări, programa servicii și (unde este disponibil) plăti în
        siguranță în aplicație.
      </p>
    </article>
  );
}

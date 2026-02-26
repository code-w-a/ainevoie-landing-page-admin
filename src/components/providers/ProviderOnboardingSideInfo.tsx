export default function ProviderOnboardingSideInfo() {
  return (
    <>
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-dark sm:p-6">
        <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
          Ce urmează după trimitere
        </h3>
        <ul className="text-body space-y-2 text-sm">
          <li>1. Contul tău este creat imediat și salvat în baza comună.</li>
          <li>2. Primești email de bun venit cu următorii pași.</li>
          <li>3. Echipa AInevoie verifică profilul și te contactează dacă lipsesc detalii.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-dark sm:p-6">
        <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
          Ai nevoie de ajutor?
        </h3>
        <p className="text-body text-sm">
          Dacă ai întrebări despre înregistrare sau documente, ne poți scrie la{" "}
          <a href="mailto:contact@ainevoie.ro" className="text-primary hover:underline">
            contact@ainevoie.ro
          </a>
          .
        </p>
      </div>
    </>
  );
}

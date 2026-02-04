import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Pagina nu a fost găsită | AInevoie",
  description: "Pagina pe care o cauți nu există sau a fost mutată.",
  // other metadata
};

const ErrorPage = () => {
  return (
    <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
      <div className="container overflow-hidden lg:max-w-[1250px]">
        <div className="mx-auto w-full max-w-[570px]">
          <div className="wow fadeInUp mb-8 w-full" data-wow-delay=".2s">
            <Image
              src="/images/404/404.svg"
              alt="404"
              className="mx-auto max-w-full"
              width={505}
              height={138}
            />
          </div>

          <div className="wow fadeInUp text-center" data-wow-delay=".2s">
            <h2 className="mb-[18px] text-[28px] font-bold text-black sm:text-[35px] dark:text-white">
              Ne pare rău, pagina nu a fost găsită
            </h2>
            <p className="text-body mb-[30px] text-base font-medium sm:text-lg">
              Pagina pe care o cauți pare să fi fost mutată, ștearsă sau nu
              există.
            </p>

            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 inline-flex justify-center rounded-md px-8 py-3 text-base font-medium text-white"
            >
              Înapoi la pagina principală
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;

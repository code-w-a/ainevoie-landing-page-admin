import React from "react";
import Graphics from "@/components/Features/Graphics";
import { Feature } from "@/types/feature";

const featuresData: Feature[] = [
  {
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 19a8 8 0 1 1 8-8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: "Căutare rapidă",
    description:
      "Găsești rapid furnizori după categorie, zonă și recenzii. Alegi informat, fără să pierzi timp.",
  },
  {
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3h8" />
        <path d="M8 7h8" />
        <path d="M7 21h10a2 2 0 0 0 2-2V8l-4-4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        <path d="M8 11h6" />
        <path d="M8 15h4" />
      </svg>
    ),
    title: "Programări fără stres",
    description:
      "Alegi ora potrivită, iar furnizorul confirmă sau propune rapid o alternativă.",
  },
  {
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    ),
    title: "Plăți în aplicație",
    description:
      "Plătești simplu și sigur. Vezi statusul plății și istoricul comenzilor, pentru ambele părți.",
  },
  {
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-9 9 8.4 8.4 0 0 1-9-9 8.4 8.4 0 0 1 9-9 8.4 8.4 0 0 1 9 9Z" />
        <path d="M7 11h6" />
        <path d="M8 15h4" />
        <path d="M21 11v9l-4-2" />
      </svg>
    ),
    title: "Mesaje & notificări",
    description:
      "Comunici direct în aplicație și primești notificări pentru cereri, confirmări și actualizări.",
  },
  {
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 12a5 5 0 1 0-5-5" />
        <path d="M3 21a9 9 0 0 1 18 0" />
        <path d="M16 3h5v5" />
      </svg>
    ),
    title: "Profil profesional",
    description:
      "Furnizorii își prezintă serviciile, tarifele și zona de lucru. Clienții văd recenzii reale.",
  },
  {
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3 6 6 .9-4.5 4.4 1.1 6.4L12 17l-5.6 2.7 1.1-6.4L3 8.9 9 8z" />
      </svg>
    ),
    title: "Evaluări & încredere",
    description:
      "După finalizare, lași o recenzie. Așa crește calitatea și scade timpul de căutare.",
  },
];

const Features = () => {
  return (
    <>
      <section id="features" className="relative z-10 pt-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-14 max-w-[690px] text-center lg:mb-[70px]"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px] md:leading-tight">
            Tot ce îți trebuie ca să rezolvi sau să oferi un serviciu
            </h2>
            <p className="text-base text-body">
            AInevoie face lucrurile simple: ceri, programezi, plătești și la final evaluezi.
            </p>
          </div>
        </div>

        <div className="container max-w-[1390px]">
          <div className="rounded-2xl bg-white px-5 pb-14 pt-14 shadow-card dark:bg-dark dark:shadow-card-dark md:pb-1 lg:pb-5 lg:pt-20 xl:px-10">
            <div className="-mx-4 flex flex-wrap">
              {featuresData.map((item, index) => (
                <div key={index} className="w-full px-4 md:w-1/2 lg:w-1/3">
                  <div
                    className="wow fadeInUp group mx-auto mb-[60px] max-w-[310px] text-center"
                    data-wow-delay=".2s"
                  >
                    <div className="mx-auto mb-8 flex h-[90px] w-[90px] items-center justify-center rounded-3xl bg-gray text-primary duration-300 group-hover:bg-primary group-hover:text-white dark:bg-[#2A2E44] dark:text-white dark:group-hover:bg-primary">
                      {item.icon}
                    </div>
                    <h3 className="mb-4 text-xl font-semibold text-black dark:text-white sm:text-[22px] xl:text-[26px]">
                      {item.title}
                    </h3>
                    <p className="text-base text-body">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/*Graphics*/}
        <Graphics />
      </section>
    </>
  );
};

export default Features;

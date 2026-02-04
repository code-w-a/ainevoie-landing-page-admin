import React from "react";
import Graphics from "@/components/WorkProcess/Graphics";
import { Feature } from "@/types/feature";

const workProcessData: Feature[] = [
  {
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_40_12)">
          <path
            d="M21.6667 16.6667H30L20 26.6667L10 16.6667H18.3333V5H21.6667V16.6667ZM6.66668 31.6667H33.3333V20H36.6667V33.3333C36.6667 33.7754 36.4911 34.1993 36.1785 34.5118C35.866 34.8244 35.442 35 35 35H5.00001C4.55798 35 4.13406 34.8244 3.8215 34.5118C3.50894 34.1993 3.33334 33.7754 3.33334 33.3333V20H6.66668V31.6667Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_40_12">
            <rect width="40" height="40" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    title: "Spui de ce ai nevoie",
    description:
      "Alegi categoria, explici ce cauți și adaugi locația și intervalul dorit.",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_40_15)">
          <path
            d="M20 36.6667C10.795 36.6667 3.33333 29.205 3.33333 20C3.33333 10.795 10.795 3.33337 20 3.33337C29.205 3.33337 36.6667 10.795 36.6667 20C36.6667 29.205 29.205 36.6667 20 36.6667ZM11.6883 30.4267C14.0476 32.3129 16.9795 33.3382 20 33.3334C23.2833 33.3334 26.2883 32.1467 28.6117 30.18C27.5262 29.0663 26.2284 28.1815 24.7951 27.578C23.3617 26.9746 21.8219 26.6647 20.2667 26.6667C18.6543 26.6648 17.0592 26.9981 15.5824 27.6454C14.1057 28.2927 12.7796 29.2398 11.6883 30.4267ZM9.36 28.0334C10.7608 26.5468 12.4511 25.3629 14.3269 24.5546C16.2027 23.7462 18.2241 23.3306 20.2667 23.3334C22.2361 23.3308 24.1866 23.7173 26.0062 24.4707C27.8259 25.224 29.4788 26.3294 30.87 27.7234C32.2968 25.7152 33.1394 23.3511 33.3043 20.8932C33.4692 18.4354 32.9499 15.9798 31.8041 13.7991C30.6584 11.6184 28.9309 9.79775 26.8133 8.53912C24.6957 7.28049 22.2708 6.6331 19.8077 6.66879C17.3445 6.70448 14.9394 7.42185 12.8592 8.7413C10.779 10.0608 9.10493 11.9307 8.02282 14.1437C6.94071 16.3567 6.49282 18.8262 6.72886 21.2783C6.9649 23.7304 7.87562 26.0691 9.36 28.035V28.0334ZM20 21.6667C18.2319 21.6667 16.5362 20.9643 15.286 19.7141C14.0357 18.4638 13.3333 16.7682 13.3333 15C13.3333 13.2319 14.0357 11.5362 15.286 10.286C16.5362 9.03575 18.2319 8.33337 20 8.33337C21.7681 8.33337 23.4638 9.03575 24.714 10.286C25.9643 11.5362 26.6667 13.2319 26.6667 15C26.6667 16.7682 25.9643 18.4638 24.714 19.7141C23.4638 20.9643 21.7681 21.6667 20 21.6667ZM20 18.3334C20.8841 18.3334 21.7319 17.9822 22.357 17.3571C22.9821 16.7319 23.3333 15.8841 23.3333 15C23.3333 14.116 22.9821 13.2681 22.357 12.643C21.7319 12.0179 20.8841 11.6667 20 11.6667C19.1159 11.6667 18.2681 12.0179 17.643 12.643C17.0179 13.2681 16.6667 14.116 16.6667 15C16.6667 15.8841 17.0179 16.7319 17.643 17.3571C18.2681 17.9822 19.1159 18.3334 20 18.3334Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_40_15">
            <rect width="40" height="40" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    title: "Primești opțiuni și confirmare",
    description:
      "Vezi furnizorii disponibili, alegi varianta potrivită, iar programarea este confirmată.",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_40_18)">
          <path
            d="M5.26834 7.44836C7.20178 5.51458 9.79501 4.38351 12.5277 4.28211C15.2603 4.18072 17.9302 5.11651 20.0017 6.9017C22.0713 5.11948 24.7377 4.18475 27.467 4.28463C30.1964 4.38452 32.7873 5.51165 34.7211 7.44037C36.6549 9.3691 37.7888 11.9571 37.8959 14.6862C38.0029 17.4153 37.0751 20.0841 35.2983 22.1584L22.3567 35.1417C21.7621 35.7365 20.9646 36.0845 20.1242 36.1161C19.2838 36.1476 18.4625 35.8603 17.825 35.3117L17.6417 35.1434L4.70168 22.1584C2.92583 20.0859 1.99764 17.4195 2.1027 14.6923C2.20776 11.9651 3.33832 9.37805 5.26834 7.44836ZM7.62501 9.80503C6.26208 11.1683 5.47643 13.0041 5.43112 14.9313C5.38581 16.8585 6.08432 18.7292 7.38168 20.155L7.62501 20.4117L20 32.7867L28.8383 23.9467L22.9467 18.055L21.18 19.8217C20.7158 20.2861 20.1646 20.6546 19.558 20.906C18.9514 21.1575 18.3012 21.287 17.6445 21.2871C16.3183 21.2874 15.0463 20.7609 14.1083 19.8234C13.1704 18.8858 12.6432 17.6141 12.6429 16.2879C12.6426 14.9617 13.1691 13.6897 14.1067 12.7517L17.61 9.2467C16.2158 8.13399 14.4707 7.55451 12.6878 7.61224C10.9049 7.66997 9.20099 8.36112 7.88168 9.5617L7.62501 9.80503ZM21.7683 14.5184C22.0809 14.2059 22.5047 14.0304 22.9467 14.0304C23.3886 14.0304 23.8125 14.2059 24.125 14.5184L31.195 21.5884L32.375 20.4117C33.7608 19.0269 34.5497 17.1549 34.5731 15.196C34.5964 13.237 33.8524 11.3467 32.5 9.92929C31.1477 8.51185 29.2944 7.67981 27.3366 7.61112C25.3787 7.54242 23.4717 8.24253 22.0233 9.5617L21.7683 9.80503L16.465 15.1084C16.1761 15.3971 16.0033 15.7818 15.9793 16.1895C15.9554 16.5972 16.0819 16.9995 16.335 17.32L16.465 17.465C16.7537 17.7539 17.1384 17.9267 17.5461 17.9507C17.9538 17.9747 18.3561 17.8481 18.6767 17.595L18.8217 17.465L21.7683 14.5184Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_40_18">
            <rect width="40" height="40" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    title: "Finalizezi și evaluezi",
    description:
      "Plătești în aplicație, iar la final lași o recenzie. Experiențele reale contează.",
  },
];

const WorkProcess = () => {
  return (
    <>
      <section id="work-process" className="relative z-10 pt-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-14 max-w-[690px] text-center lg:mb-[70px]"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px] md:leading-tight">
            Cum funcționează Alnevoie, în 3 pași
            </h2>
            <p className="text-base text-body">
              Simplu pentru clienți. Eficient pentru furnizori.
            </p>
          </div>
        </div>

        <div className="container max-w-[1390px]">
          <div className="rounded-2xl bg-white px-5 pb-14 pt-14 shadow-card dark:bg-dark dark:shadow-card-dark md:pb-1 lg:pb-5 lg:pt-20 xl:px-10">
            <div className="-mx-4 flex flex-wrap justify-center">
              {workProcessData.map((item, index) => (
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

export default WorkProcess;

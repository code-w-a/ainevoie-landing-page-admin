"use client";

import Graphics from "@/components/Screens/Graphics";
import Image from "next/image";
import { useTranslations } from "next-intl";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const SCREEN_SRCS = [
  "/images/screenshots/splash.jpg",
  "/images/screenshots/Onboarding_unu.jpg",
  "/images/screenshots/Onboarding_doi.jpg",
  "/images/screenshots/Onboarding_trei.jpg",
  "/images/screenshots/utilizator_ecran_home.jpg",
  "/images/screenshots/utilizator_ecran_prestator.jpg",
  "/images/screenshots/utilizator_ecran_confirmare_rezervare.jpg",
  "/images/screenshots/utilizator_ecran_chat.jpg",
  "/images/screenshots/Prestator_cereri.jpg",
  "/images/screenshots/Prestator_calendar.jpg",
  "/images/screenshots/Prestator_ecran_recenzii.jpg",
] as const;

const ALT_KEYS = [
  "alt0",
  "alt1",
  "alt2",
  "alt3",
  "alt4",
  "alt5",
  "alt6",
  "alt7",
  "alt8",
  "alt9",
  "alt10",
] as const;

const PhoneFrameOverlay = () => {
  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 z-50 mx-auto w-full">
      <div className="relative mx-auto w-[272px]">
        <div className="absolute top-24 -left-[1px] h-10 w-[3px] rounded-full bg-slate-300/80 shadow-sm dark:bg-slate-700/80" />
        <div className="absolute top-36 -left-[1px] h-16 w-[3px] rounded-full bg-slate-300/80 shadow-sm dark:bg-slate-700/80" />
        <div className="absolute top-28 -right-[1px] h-20 w-[3px] rounded-full bg-slate-300/80 shadow-sm dark:bg-slate-700/80" />

        <div className="relative h-[592px] rounded-[2.9rem] border-[5px] border-slate-300 bg-transparent shadow-[0_35px_90px_rgba(15,23,42,0.18)] dark:border-slate-600">
          <div className="absolute inset-[5px] rounded-[2.65rem] border-x-[7px] border-t-[40px] border-b-[7px] border-slate-950" />
          <div className="absolute inset-x-0 top-3 z-20 flex justify-center">
            <div className="flex h-6 w-28 items-center justify-center rounded-full bg-slate-950/95 ring-1 ring-white/5">
              <div className="h-1.5 w-14 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Screens = () => {
  const t = useTranslations("Screens");

  return (
    <>
      <section id="screens" className="relative z-20 pt-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-10 max-w-[690px] text-center"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black sm:text-4xl md:text-[44px] md:leading-tight dark:text-white">
              {t("title")}
            </h2>
            <p className="text-body text-base">{t("subtitle")}</p>
          </div>
        </div>

        <div className="container">
          <div
            className="wow fadeInUp mx-auto max-w-[1000px]"
            data-wow-delay=".2s"
          >
            <Swiper
              className="swiper mySwiper relative z-20"
              modules={[Navigation]}
              centeredSlides={true}
              navigation={{
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }}
              loop={true}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 28,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 28,
                },
              }}
            >
              <PhoneFrameOverlay />

              {SCREEN_SRCS.map((src, i) => (
                <SwiperSlide key={src}>
                  <div className="mx-auto w-[272px] max-w-full px-[12px] pt-[45px] pb-[15px]">
                    <div className="overflow-hidden rounded-[2.25rem] bg-black">
                      <Image
                        width={1080}
                        height={2316}
                        src={src}
                        alt={t(ALT_KEYS[i])}
                        sizes="248px"
                        className="h-auto w-full"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}

              <div className="flex items-center justify-center gap-x-4 pt-20">
                <button className="swiper-button-prev">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_46_342)">
                      <path
                        d="M6.52334 10.8334L10.9933 15.3034L9.81501 16.4817L3.33334 10L9.815 3.51836L10.9933 4.69669L6.52334 9.16669L16.6667 9.16669L16.6667 10.8334L6.52334 10.8334Z"
                        fill="currentColor"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_46_342">
                        <rect
                          width="20"
                          height="20"
                          fill="white"
                          transform="translate(20 20) rotate(180)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </button>
                <button className="swiper-button-next">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_46_337)">
                      <path
                        d="M13.4767 9.16664L9.00667 4.69664L10.185 3.51831L16.6667 9.99998L10.185 16.4816L9.00667 15.3033L13.4767 10.8333H3.33334V9.16664H13.4767Z"
                        fill="currentColor"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_46_337">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </button>
              </div>
            </Swiper>
          </div>
        </div>

        {/*Graphics*/}
        <Graphics />
      </section>
    </>
  );
};

export default Screens;

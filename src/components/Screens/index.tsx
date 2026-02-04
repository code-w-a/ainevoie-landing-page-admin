"use client";

import Graphics from "@/components/Screens/Graphics";
import Image from "next/image";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const Screens = () => {
  return (
    <>
      <section id="screens" className="relative z-20 pt-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-10 max-w-[690px] text-center"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black sm:text-4xl md:text-[44px] md:leading-tight dark:text-white">
              Arată bine. Se folosește ușor.
            </h2>
            <p className="text-body text-base">
              De la căutare și programare, până la plăți și recenzii — totul e gândit să fie intuitiv.
            </p>
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
                  spaceBetween: 40,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 40,
                },
              }}
            >
              <div className="absolute top-0 right-0 left-0 z-50 mx-auto w-full md:w-1/3">
                <Image
                  width={288}
                  height={594}
                  src={"/images/screens/mobile-frame.png"}
                  alt="mobile-frame"
                  className="mx-auto max-w-full"
                />
              </div>

              <SwiperSlide>
                <div className="xs:max-w-[265px] mx-auto w-full max-w-[252px]">
                  <Image
                    width={265}
                    height={573}
                    src={"/images/screens/screen-1-light.png"}
                    alt="screenshot"
                    className="mx-auto w-full rounded-2xl"
                  />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="xs:max-w-[265px] mx-auto w-full max-w-[252px]">
                  <Image
                    width={265}
                    height={573}
                    src={"/images/screens/screen-2-light.png"}
                    alt="screenshot"
                    className="mx-auto w-full rounded-2xl"
                  />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="xs:max-w-[265px] mx-auto w-full max-w-[252px]">
                  <Image
                    width={265}
                    height={573}
                    src={"/images/screens/screen-3-light.png"}
                    alt="screenshot"
                    className="mx-auto w-full rounded-2xl"
                  />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="xs:max-w-[265px] mx-auto w-full max-w-[252px]">
                  <Image
                    width={265}
                    height={573}
                    src={"/images/screens/screen-1-light.png"}
                    alt="screenshot"
                    className="mx-auto w-full rounded-2xl"
                  />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="xs:max-w-[265px] mx-auto w-full max-w-[252px]">
                  <Image
                    width={265}
                    height={573}
                    src={"/images/screens/screen-2-light.png"}
                    alt="screenshot"
                    className="mx-auto w-full rounded-2xl"
                  />
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="xs:max-w-[265px] mx-auto w-full max-w-[252px]">
                  <Image
                    width={265}
                    height={573}
                    src={"/images/screens/screen-3-light.png"}
                    alt="screenshot"
                    className="mx-auto w-full rounded-2xl"
                  />
                </div>
              </SwiperSlide>

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

import React from "react";
import { Testimonial } from "@/types/testimonial";
import Image from "next/image";

const testimonialData: Testimonial[] = [
  {
    quote:
      "Am găsit rapid un instalator disponibil în aceeași zi. Programarea a fost simplă și totul a fost clar din start.",
    authorImage: "/images/testimonials/author-1.png",
    authorName: "Andreea M.",
    authorRole: "Client",
    review: 5.0,
  },
  {
    quote:
      "Cereri mai bine organizate și mult mai puține apeluri. Confirm programările din aplicație și am o evidență curată.",
    authorImage: "/images/testimonials/author-2.png",
    authorName: "Marius I.",
    authorRole: "Furnizor servicii",
    review: 5.0,
  },
  {
    quote:
      "Mi-a plăcut că am văzut recenziile și tarifele înainte. Am ales repede și am economisit timp.",
    authorImage: "/images/testimonials/author-3.png",
    authorName: "Elena P.",
    authorRole: "Client",
    review: 4.9,
  },
  {
    quote:
      "Profilul meu arată profesionist, iar clienții vin cu cereri clare. Asta face diferența.",
    authorImage: "/images/testimonials/author-04.png",
    authorName: "Cristian D.",
    authorRole: "Furnizor",
    review: 4.8,
  },
];

const Testimonials = () => {
  return (
    <>
      <section id="testimonials" className="relative z-10 pb-[60px] pt-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-14 max-w-[690px] text-center lg:mb-[70px]"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px] md:leading-tight">
              Ce spun utilizatorii
            </h2>
            <p className="text-base text-body">
              Feedback real de la clienți și furnizori.
            </p>
          </div>
        </div>

        <div className="container overflow-hidden lg:max-w-[1160px]">
          <div className="-mx-6 flex flex-wrap">
            {testimonialData.map((item, index) => (
              <div key={index} className="w-full px-6 lg:w-1/2">
                <div
                  className="wow fadeInUp mb-[50px] rounded-lg bg-white px-7 py-9 shadow-card dark:bg-dark dark:shadow-card-dark sm:px-9 lg:px-7 xl:px-9"
                  data-wow-delay=".2s"
                >
                  <div className="mb-5 border-b border-stroke dark:border-stroke-dark">
                    <p className="pb-9 text-base text-body">{item.quote}</p>
                  </div>

                  <div className="items-center justify-between sm:flex lg:block xl:flex">
                    <div className="mb-4 flex items-center sm:mb-0 lg:mb-4 xl:mb-0">
                      <div className="mr-4 h-[56px] w-full max-w-[56px] rounded-full">
                        <Image
                          width={56}
                          height={56}
                          src={item.authorImage}
                          alt="author"
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div>
                        <h5 className="text-base font-medium text-black dark:text-white">
                          {item.authorName}
                        </h5>
                        <p className="text-sm text-body">{item.authorRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:justify-end lg:justify-start xl:justify-end">
                      <p className="text-base font-medium text-black dark:text-white">
                        {item.review}
                      </p>
                      <div className="flex items-center space-x-[6px]">
                        {Array(5)
                          .fill(null)
                          .map((_, starIndex) => (
                            <span key={starIndex}>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <g clipPath="url(#clip0_49_480)">
                                  <path
                                    d="M10 15.2171L4.1225 18.5071L5.435 11.9004L0.489166 7.32712L7.17833 6.53378L10 0.417114L12.8217 6.53378L19.5108 7.32712L14.565 11.9004L15.8775 18.5071L10 15.2171Z"
                                    fill="#f39c12"
                                  />
                                </g>
                                <defs>
                                  <clipPath id="clip0_49_480">
                                    <rect
                                      width="20"
                                      height="20"
                                      fill="white"
                                      transform="translate(0 0.000488281)"
                                    />
                                  </clipPath>
                                </defs>
                              </svg>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Client } from "@/types/client";

const clientsData: Client[] = [
  {
    logo: "/images/clients/client-01.svg",
    link: "#",
    width: 92,
    height: 28,
  },
  {
    logo: "/images/clients/client-02.svg",
    link: "#",
    width: 120,
    height: 24,
  },
  {
    logo: "/images/clients/client-03.svg",
    link: "#",
    width: 99,
    height: 24,
  },
  {
    logo: "/images/clients/client-04.svg",
    link: "#",
    width: 89,
    height: 32,
  },
  {
    logo: "/images/clients/client-05.svg",
    link: "#",
    width: 108,
    height: 32,
  },
  {
    logo: "/images/clients/client-06.svg",
    link: "#",
    width: 106,
    height: 32,
  },
];

const Clients = () => {
  return (
    <>
      <section className="relative z-10 bg-[#F8FAFB] pb-[50px] pt-[70px] dark:bg-[#15182B]">
        <div
          className="wow fadeInUp container overflow-hidden lg:max-w-[1200px]"
          data-wow-delay=".2s"
        >
          <div className="-mx-4 flex flex-wrap items-center justify-center">
            {clientsData.map((item, index) => (
              <div
                key={index}
                className="w-1/2 px-4 sm:w-1/3 md:w-1/4 lg:w-1/6"
              >
                <div className="mb-5 text-center">
                  <Link href={item.link} className="block">
                    <Image
                      width={item.width}
                      height={item.height}
                      priority
                      src={item.logo}
                      alt="client"
                      className="mx-auto max-w-full opacity-[65%] hover:opacity-100"
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Clients;

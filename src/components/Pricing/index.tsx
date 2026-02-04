"use client";

import React, { useState } from "react";
import { Price } from "@/types/priceItem";

import { pricingData } from "../../stripe/pricingData";
import { PricingItem } from "./PricingItem";

const Pricing = () => {
  const [planType, setPlanType] = useState(false);

  return (
    <>
      <section id="pricing" className="relative z-10 pt-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-10 max-w-[690px] text-center"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[44px] md:leading-tight">
              Planuri simple. Fără surprize.
            </h2>
            <p className="text-base text-body">
              Alege planul potrivit în funcție de cât folosești aplicația. Poți schimba oricând.
            </p>
          </div>
        </div>

        <div className="container max-w-[1120px] overflow-hidden">
          <div
            className="wow fadeInUp mb-[60px] flex items-center justify-center"
            data-wow-delay=".25s"
          >
            <label htmlFor="togglePlan" className="inline-flex items-center">
              <input
                type="checkbox"
                name="togglePlan"
                id="togglePlan"
                className="sr-only"
                onClick={() => setPlanType(!planType)}
              />
              <span className="monthly text-sm font-medium text-black dark:text-white">
                Lunar
              </span>
              <span className="mx-5 flex h-[34px] w-[60px] cursor-pointer items-center rounded-full bg-primary p-[3px]">
                <span
                  className={`${planType && "translate-x-[26px]"} block h-7 w-7 rounded-full bg-white duration-300`}
                ></span>
              </span>
              <span className="yearly text-sm font-medium text-black dark:text-white">
                Anual
              </span>
            </label>
          </div>

          <div className="-mx-6 flex flex-wrap justify-center">
            {pricingData &&
              pricingData.map((price, key) => (
                <PricingItem price={price} key={key} planType={planType} />
              ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;

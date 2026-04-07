"use client";
import { integrations, messages } from "@integrations-config";
import axios from "axios";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";

export const PricingItem = ({ price, planType }: any) => {
  const t = useTranslations("Pricing");
  const tPlans = useTranslations("PricingPlans");
  const locale = useLocale();
  const numberLocale = locale === "en" ? "en-GB" : "ro-RO";

  const planKey = price.nickname as "Start" | "Standard" | "Pro";
  const planBenefits = [0, 1, 2, 3].map((i) =>
    tPlans(`${planKey}.b${i}`)
  );
  // POST request
  const handleSubscription = async (e: any) => {
    e.preventDefault();

    if (integrations?.isStripeEnabled) {
      const { data } = await axios.post(
        "/api/payment",
        {
          priceId: price.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      window.location.assign(data);
    } else {
      toast.error(messages.stripe);
    }
  };

  return (
    <div className="w-full px-6 md:w-1/2 lg:w-1/3">
      <div className="wow fadeInUp shadow-card dark:bg-dark dark:shadow-card-dark relative mb-10 rounded-xl bg-white px-9 py-10 lg:mb-4 lg:px-7 xl:px-9">
        {price.nickname === "Standard" && (
          <span className="text-primary absolute top-5 right-5 text-sm font-medium underline">
            {t("popular")}
          </span>
        )}

        <h3 className="mb-2 text-[22px] leading-tight font-semibold text-black dark:text-white">
          {price.nickname}
        </h3>
        <p className="text-body mb-7 text-base">
          {tPlans(`${planKey}.description`)}
        </p>

        <p className="border-stroke dark:border-stroke-dark border-b pb-5 text-black dark:text-white">
          <span className="text-[40px] leading-none font-bold">
            {new Intl.NumberFormat(numberLocale, {
              style: "currency",
              currency: "RON",
              maximumFractionDigits: 0,
            }).format(price.unit_amount / 100)}
          </span>
          <span className="text-body text-base"> {t("perMonth")}</span>
          {planType && (
            <span className="text-body ml-2 text-sm">{t("billedYearly")}</span>
          )}
        </p>

        <div className="space-y-4 pt-[30px] pb-10">
          <p className="dark:text-body flex text-base text-black">
            <span className="mt-1 mr-[10px]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_44_7)">
                  <path
                    d="M6.66674 10.1147L12.7947 3.98599L13.7381 4.92866L6.66674 12L2.42407 7.75733L3.36674 6.81466L6.66674 10.1147Z"
                    fill="#d35400"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_44_7">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            {planBenefits[0]}
          </p>
          <p className="dark:text-body flex text-base text-black">
            <span className="mt-1 mr-[10px]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_44_7)">
                  <path
                    d="M6.66674 10.1147L12.7947 3.98599L13.7381 4.92866L6.66674 12L2.42407 7.75733L3.36674 6.81466L6.66674 10.1147Z"
                    fill="#d35400"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_44_7">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            {planBenefits[1]}
          </p>
          <p className="dark:text-body flex text-base text-black">
            <span className="mt-1 mr-[10px]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_44_7)">
                  <path
                    d="M6.66674 10.1147L12.7947 3.98599L13.7381 4.92866L6.66674 12L2.42407 7.75733L3.36674 6.81466L6.66674 10.1147Z"
                    fill="#d35400"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_44_7">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            {planBenefits[2]}
          </p>
          <p className="dark:text-body flex text-base text-black">
            <span className="mt-1 mr-[10px]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_44_7)">
                  <path
                    d="M6.66674 10.1147L12.7947 3.98599L13.7381 4.92866L6.66674 12L2.42407 7.75733L3.36674 6.81466L6.66674 10.1147Z"
                    fill="#d35400"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_44_7">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            {planBenefits[3]}
          </p>
        </div>

        <button
          aria-label={t("choosePlan")}
          onClick={handleSubscription}
          className={`block w-full rounded-md px-8 py-[10px] text-center text-base font-medium text-white ${price.nickname === "Standard" ? "bg-primary hover:bg-primary/90" : "hover:bg-primary dark:hover:bg-primary bg-black dark:bg-[#2A2E44]"}`}
        >
          {tPlans(`${planKey}.cta`)}
        </button>
      </div>
    </div>
  );
};

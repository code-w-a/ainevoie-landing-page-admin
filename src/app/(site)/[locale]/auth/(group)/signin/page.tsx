"use client";

import { GoogleAuth } from "@/components/Auth/google-auth";
import { MagicLinkForm } from "@/components/Auth/magic-link-form";
import { TabContent, TabList, Tabs, TabTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { SignInForm } from "./_components/form";

const SigninPage = () => {
  const t = useTranslations("Auth");
  const tabs = useMemo(
    () => [
      { value: "magic-link" as const, label: t("tabMagicLink") },
      { value: "password" as const, label: t("tabPassword") },
    ],
    [t]
  );

  return (
    <>
      <div className="text-center">
        <h3 className="mb-[10px] text-2xl font-bold text-black sm:text-[28px] dark:text-white">
          {t("signInHeading")}
        </h3>

        <p className="text-body mb-11">{t("signInSub")}</p>

        <GoogleAuth label={t("googleContinue")} />

        <div className="relative my-7.5 flex items-center">
          <div className="bg-stroke dark:bg-stroke-dark h-[1px] w-full max-[200px]:hidden" />
          <p className="text-body absolute right-1/2 translate-x-1/2 bg-[#F8FAFB] px-5 min-[200px]:whitespace-nowrap dark:bg-[#15182A]">
            {t("signInDivider")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="magic-link">
        <TabList className="border-stroke dark:border-stroke-dark mx-auto mb-12 flex flex-col items-center justify-center gap-1 rounded-lg border p-1 md:flex-row">
          {tabs.map(({ value, label }) => (
            <TabTrigger
              key={value}
              className="text-body hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary data-[active=true]:bg-primary/5 data-[active=true]:text-primary data-[active=true]:dark:hover:border-primary data-[active=true]:dark:bg-primary/5 w-full rounded-lg px-6 py-3 text-base outline-hidden transition-all duration-300 data-[active=true]:border dark:border-transparent dark:bg-transparent dark:hover:shadow-none"
              value={value}
            >
              {label}
            </TabTrigger>
          ))}
        </TabList>

        <TabContent value="magic-link">
          <MagicLinkForm />
        </TabContent>

        <TabContent value="password">
          <SignInForm />
        </TabContent>
      </Tabs>
    </>
  );
};

export default SigninPage;

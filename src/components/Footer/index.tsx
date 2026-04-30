"use client";

import { Checkbox } from "@/components/ui/checkbox";
import FooterBottom from "@/components/Footer/FooterBottom";
import { Link } from "@/i18n/navigation";
import { FooterMenu } from "@/types/footerMenu";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";

const Footer = () => {
  const t = useTranslations("Footer");
  const locale = useLocale();

  const footerNavData: FooterMenu[] = useMemo(
    () => [
      {
        title: t("colProduct"),
        navItems: [
          { label: t("navProduct"), route: "/#home" },
          { label: t("navBenefits"), route: "/#features" },
          { label: t("navHow"), route: "/#work-process" },
          // Pricing is temporarily hidden until plan details are ready to publish.
          { label: t("navScreens"), route: "/#screens" },
        ],
      },
      {
        title: t("colClients"),
        navItems: [
          { label: t("navClients"), route: "/#home" },
          { label: t("navChooseProvider"), route: "/#faq" },
          { label: t("navSafety"), route: "/#testimonials" },
          { label: t("navFaq"), route: "/#faq" },
          { label: t("navContact"), route: "/#support" },
        ],
      },
      {
        title: t("colProviders"),
        navItems: [
          { label: t("navBecome"), route: "/providers/onboarding" },
          { label: t("navOnboarding"), route: "/providers/onboarding/form" },
          { label: t("navRequests"), route: "/#work-process" },
          { label: t("navScheduling"), route: "/#work-process" },
          // Pricing is temporarily hidden until plan details are ready to publish.
        ],
      },
    ],
    [t]
  );

  const [footerEmail, setFooterEmail] = useState("");
  const [footerAcceptTerms, setFooterAcceptTerms] = useState(false);
  const [footerStatus, setFooterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleFooterNewsletterSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const email = footerEmail.trim();
    if (!email) {
      setFooterStatus("error");
      toast.error(t("toastEmailRequired"));
      return;
    }
    if (!footerAcceptTerms) {
      setFooterStatus("error");
      toast.error(t("toastTermsRequired"));
      return;
    }

    try {
      setFooterStatus("loading");

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-next-intl-locale": locale,
        },
        body: JSON.stringify({ acceptTerms: footerAcceptTerms, email }),
      });

      if (res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { status?: string }
          | null;
        const isAlready = payload?.status === "already_subscribed";
        toast.success(
          isAlready ? t("toastAlready") : t("toastSubscribed")
        );
        setFooterStatus("success");
        setFooterEmail("");
        setFooterAcceptTerms(false);
        return;
      }

      const errBody = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      const serverMsg =
        typeof errBody?.error === "string" ? errBody.error : null;
      setFooterStatus("error");
      toast.error(
        serverMsg ??
          (res.status === 503
            ? t("toastNewsletterDown")
            : t("toastSubscribeFail"))
      );
    } catch {
      setFooterStatus("error");
      toast.error(t("toastNetwork"));
    }
  }

  return (
    <>
      <footer>
        <div className="bg-[#F8FAFB] pb-[46px] pt-[95px] dark:bg-[#15182A]">
          <div className="container max-w-[1390px]">
            <div className="-mx-4 flex flex-wrap">
              <div className="w-full px-4 lg:w-4/12 xl:w-5/12">
                <div className="mb-11 max-w-[320px]">
                  <Link href="/" className="mb-8 inline-block">
                    <Image
                      width={173}
                      height={34}
                      src={"/images/logo/logo.svg"}
                      alt="Logo"
                      priority
                      className="block max-w-full dark:hidden"
                      style={{ width: "auto", height: "auto" }}
                    />
                    <Image
                      width={173}
                      height={34}
                      src={"/images/logo/logo-white.svg"}
                      alt="Logo"
                      priority
                      className="hidden max-w-full dark:block"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </Link>
                  <p className="mb-6 text-base text-body">{t("tagline")}</p>
                </div>
              </div>

              <div className="w-full px-4 lg:w-8/12 xl:w-7/12">
                <div className="-mx-4 flex flex-wrap">
                  {footerNavData.map((group) => (
                    <div
                      key={group.title}
                      className="w-full px-4 sm:w-1/2 lg:w-1/5"
                    >
                      <div className="mb-11">
                        <h3 className="mb-8 text-[22px] font-medium text-black dark:text-white">
                          {group.title}
                        </h3>

                        <ul className="space-y-[10px]">
                          {group.navItems &&
                            group.navItems.map((item, index) => (
                              <li key={index}>
                                <Link
                                  href={item.route}
                                  className="inline-block text-base text-body hover:text-primary"
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ))}

                  <div className="w-full px-4 sm:w-1/2 lg:w-2/5">
                    <div className="mb-11">
                      <h3 className="mb-8 text-[22px] font-medium text-black dark:text-white">
                        {t("newsletter")}
                      </h3>

                      <form onSubmit={handleFooterNewsletterSubmit}>
                        <div className="flex flex-col gap-2">
                          <input
                            type="email"
                            name="footerEmail"
                            value={footerEmail}
                            onChange={(e) => setFooterEmail(e.target.value)}
                            placeholder={t("emailPlaceholder")}
                            autoComplete="email"
                            className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-4 py-3 text-sm outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                            disabled={footerStatus === "loading"}
                          />
                          <div className="text-xs leading-relaxed">
                            <Checkbox
                              name="footerAcceptTerms"
                              checked={footerAcceptTerms}
                              disabled={footerStatus === "loading"}
                              onChange={(event) => setFooterAcceptTerms(event.target.checked)}
                              label={
                                <>
                                  {t("consentAgree")}{" "}
                                  <Link href="/terms" className="text-primary hover:underline">
                                    {t("terms")}
                                  </Link>{" "}
                                  {t("consentAnd")}{" "}
                                  <Link href="/privacy" className="text-primary hover:underline">
                                    {t("privacy")}
                                  </Link>
                                  {t("consentEnd")}
                                </>
                              }
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={footerStatus === "loading" || !footerAcceptTerms}
                            className="bg-primary hover:bg-primary/90 w-full rounded-sm px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {footerStatus === "loading"
                              ? t("subscribing")
                              : t("subscribe")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FooterBottom />
      </footer>
    </>
  );
};

export default Footer;

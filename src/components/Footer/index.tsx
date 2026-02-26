"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import FooterBottom from "@/components/Footer/FooterBottom";
import { FooterMenu } from "@/types/footerMenu";
import toast from "react-hot-toast";

const footerNavData: FooterMenu[] = [
  {
    title: "Produs",
    navItems: [
      {
        label: "Produs",
        route: "/#home",
      },
      {
        label: "Beneficii",
        route: "/#features",
      },
      {
        label: "Cum funcționează",
        route: "/#work-process",
      },
      {
        label: "Planuri",
        route: "/#pricing",
      },
      {
        label: "Capturi",
        route: "/#screens",
      },
    ],
  },
  {
    title: "Pentru clienți",
    navItems: [
      {
        label: "Pentru clienți",
        route: "/#home",
      },
      {
        label: "Cum alegi un furnizor",
        route: "/#faq",
      },
      {
        label: "Siguranță & recenzii",
        route: "/#testimonials",
      },
      {
        label: "Întrebări frecvente",
        route: "/#faq",
      },
      {
        label: "Contact",
        route: "/#support",
      },
    ],
  },
  {
    title: "Pentru furnizori",
    navItems: [
      {
        label: "Devino prestator",
        route: "/providers/onboarding",
      },
      {
        label: "Începe onboardingul",
        route: "/providers/onboarding/form",
      },
      {
        label: "Primește cereri",
        route: "/#work-process",
      },
      {
        label: "Gestionare programări",
        route: "/#work-process",
      },
      {
        label: "Planuri",
        route: "/#pricing",
      },
    ],
  },
];

const Footer = () => {
  const [footerEmail, setFooterEmail] = useState("");
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
      toast.error("Scrie adresa de email ca să te înscrii.");
      return;
    }

    try {
      setFooterStatus("loading");

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { status?: string }
          | null;
        const isAlready = payload?.status === "already_subscribed";
        toast.success(
          isAlready
            ? "Ești deja pe listă. Îți dăm un semn la lansare."
            : "Super! Ești pe listă. Îți scriem când lansăm în zona ta."
        );
        setFooterStatus("success");
        setFooterEmail("");
        return;
      }

      if (res.status === 503) {
        setFooterStatus("error");
        toast.error("Înscrierea la newsletter e indisponibilă momentan.");
        return;
      }

      setFooterStatus("error");
      toast.error("Nu am reușit să te înscriem. Încearcă din nou.");
    } catch {
      setFooterStatus("error");
      toast.error("Eroare de rețea. Încearcă din nou.");
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
                  <p className="mb-6 text-base text-body">
                    AInevoie conectează clienții cu furnizori de servicii locali. Simplu, rapid și transparent: cerere, programare, plată și feedback.
                  </p>
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

                  {/* Newsletter column (right-most on desktop) */}
                  <div className="w-full px-4 sm:w-1/2 lg:w-2/5">
                    <div className="mb-11">
                      <h3 className="mb-8 text-[22px] font-medium text-black dark:text-white">
                        Newsletter
                      </h3>

                      <form onSubmit={handleFooterNewsletterSubmit}>
                        <div className="flex flex-col gap-2">
                          <input
                            type="email"
                            name="footerEmail"
                            value={footerEmail}
                            onChange={(e) => setFooterEmail(e.target.value)}
                            placeholder="Email"
                            autoComplete="email"
                            className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-4 py-3 text-sm outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                            disabled={footerStatus === "loading"}
                          />
                          <button
                            type="submit"
                            disabled={footerStatus === "loading"}
                            className="bg-primary hover:bg-primary/90 w-full rounded-sm px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {footerStatus === "loading" ? "..." : "Abonează-te"}
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

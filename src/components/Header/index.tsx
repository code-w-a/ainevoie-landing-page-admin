"use client";

import DarkModeSwitcher from "@/components/Header/DarkModeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu } from "@/types/menu";
import { onScroll } from "@/utils/scrollActive";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const Header = () => {
  const t = useTranslations("Header");
  const pathname = usePathname();

  const menuData: Menu[] = useMemo(
    () => [
      { label: t("navHome"), route: "/#home" },
      { label: t("navFeatures"), route: "/#features" },
      { label: t("navAbout"), route: "/#about" },
      { label: t("navWork"), route: "/#work-process" },
      { label: t("navPricing"), route: "/#pricing" },
      { label: t("navScreens"), route: "/#screens" },
      { label: t("navTestimonials"), route: "/#testimonials" },
      { label: t("navFaq"), route: "/#faq" },
      { label: t("navContact"), route: "/#support" },
    ],
    [t]
  );

  useEffect(() => {
    if (pathname === "/") {
      window.addEventListener("scroll", onScroll);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  const [sticky, setSticky] = useState(false);

  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  const [openIndex, setOpenIndex] = useState(-1);

  const handleSubmenu = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  const closeMenu = () => {
    setNavbarOpen(false);
  };

  return (
    <>
      <header
        className={`navbar border-stroke dark:border-stroke-dark top-0 left-0 z-10 w-full ${
          sticky
            ? "fixed border-b bg-white/95 backdrop-blur-xs dark:bg-black/95"
            : "absolute"
        }`}
      >
        <div className="relative container max-w-[1400px]">
          <div className="flex items-center justify-between">
            <div className="block py-4 lg:py-0">
              <Link href="/" className="block max-w-[145px] sm:max-w-[180px]">
                <Image
                  width={173}
                  height={34}
                  src={"/images/logo/logo.svg"}
                  alt="Logo"
                  priority
                  className="block dark:hidden"
                  style={{ width: "auto", height: "auto" }}
                />
                <Image
                  width={173}
                  height={34}
                  src={"/images/logo/logo-white.svg"}
                  alt="Logo"
                  priority
                  className="hidden dark:block"
                  style={{ width: "auto", height: "auto" }}
                />
              </Link>
            </div>

            <button
              type="button"
              onClick={navbarToggleHandler}
              className="navbarOpen absolute top-1/2 right-4 z-50 flex h-10 w-10 -translate-y-1/2 flex-col items-center justify-center space-y-[6px] font-bold lg:hidden"
              aria-label={t("openMenu")}
              name={t("openMenu")}
            >
              <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
              <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
              <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
            </button>

            <div
              className={`${navbarOpen ? "" : "hidden"} menu-wrapper relative justify-between lg:flex`}
            >
              <button
                type="button"
                onClick={() => setNavbarOpen(false)}
                className="navbarClose fixed top-10 right-10 z-9999 flex h-10 w-10 flex-col items-center justify-center font-bold lg:hidden"
                name={t("closeMenu")}
                aria-label={t("closeMenu")}
              >
                <span className="block h-[2px] w-7 rotate-45 bg-black dark:bg-white"></span>
                <span className="-mt-[2px] block h-[2px] w-7 -rotate-45 bg-black dark:bg-white"></span>
              </button>

              <nav className="lg:backdrop-blur-0 fixed top-0 left-0 z-999 flex h-screen w-full items-center justify-center bg-white/95 text-center backdrop-blur-xs lg:static lg:h-auto lg:w-max lg:bg-transparent lg:backdrop-blur-none dark:bg-black/95 lg:dark:bg-transparent">
                <div className="flex flex-col items-center">
                  <ul className="items-center space-y-3 lg:flex lg:space-y-0 lg:space-x-8 xl:space-x-10">
                    {menuData.map((item, index) =>
                      item.children ? (
                        <li
                          key={index}
                          className="submenu-item menu-item group relative"
                        >
                          <Link
                            onClick={() => handleSubmenu(index)}
                            href={item.route}
                            className={`${sticky ? "lg:py-[21px]" : "lg:py-7"} submenu-taggler hover:text-primary group-hover:text-primary dark:hover:text-primary inline-flex items-center text-base font-medium text-black dark:text-white`}
                          >
                            {item.label}
                            <span className="pl-3">
                              <svg
                                width="14"
                                height="8"
                                viewBox="0 0 14 8"
                                className={`fill-current ${openIndex === index ? "rotate-180 lg:rotate-0" : ""}`}
                              >
                                <path d="M6.54564 5.09128L11.6369 0L13.0913 1.45436L6.54564 8L0 1.45436L1.45436 0L6.54564 5.09128Z" />
                              </svg>
                            </span>
                          </Link>

                          <ul
                            className={`${openIndex === index ? "" : "hidden"} submenu lg:shadow-card lg:dark:shadow-card-dark space-y-5 pt-5 duration-300 lg:invisible lg:absolute lg:top-[120%] lg:block lg:w-[250px] lg:rounded-lg lg:bg-white lg:px-8 lg:pb-5 lg:text-left lg:opacity-0 lg:group-hover:visible lg:group-hover:top-full lg:group-hover:opacity-100 dark:lg:border-transparent dark:lg:bg-[#15182A]`}
                          >
                            {item.children.map((childItem, childIndex) => (
                              <li key={childIndex}>
                                <Link
                                  href={childItem.route}
                                  onClick={closeMenu}
                                  className="font-heading hover:text-primary dark:hover:text-primary inline-flex items-center justify-center text-center text-base text-black dark:text-white"
                                >
                                  {childItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ) : (
                        <li key={index} className="menu-item">
                          <Link
                            href={item.route}
                            onClick={closeMenu}
                            className={`${sticky ? "lg:py-[21px]" : "lg:py-7"} ud-menu-scroll hover:text-primary dark:hover:text-primary inline-flex items-center text-base font-medium text-black dark:text-white`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      )
                    )}
                  </ul>
                  <Link
                    href="/providers/onboarding"
                    onClick={closeMenu}
                    className="bg-primary hover:bg-primary/90 mt-6 inline-flex rounded-md px-6 py-3 text-sm font-medium text-white lg:hidden"
                  >
                    {t("ctaProvider")}
                  </Link>
                </div>
              </nav>
            </div>

            <div className="mr-[60px] flex items-center justify-end lg:mr-0">
              <Link
                href="/providers/onboarding"
                className="bg-primary hover:bg-primary/90 mr-3 hidden rounded-md px-4 py-2 text-sm font-medium text-white lg:inline-flex"
              >
                {t("ctaProvider")}
              </Link>
              <LanguageSwitcher />
              <DarkModeSwitcher />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

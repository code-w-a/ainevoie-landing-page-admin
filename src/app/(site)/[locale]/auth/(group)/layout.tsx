"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PropsWithChildren, useMemo } from "react";

export default function Layout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const t = useTranslations("Auth");
  const links = useMemo(
    () => [
      { href: "/auth/signin" as const, label: t("tabSignIn") },
      { href: "/auth/signup" as const, label: t("tabSignUp") },
    ],
    [t]
  );

  return (
    <div className="shadow-card dark:shadow-card-dark mx-auto mt-[150px] mb-[110px] w-full max-w-[520px] rounded-lg bg-[#F8FAFB] px-6 py-10 sm:p-[50px] lg:mt-[220px] dark:bg-[#15182A]">
      <nav className="border-stroke dark:border-stroke-dark dark:bg-dark mb-9 flex items-center space-x-3 rounded-md border bg-white px-[10px] py-2">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              "hover:bg-primary/90 block w-full rounded-sm p-2 text-center text-base font-medium hover:text-white" +
              (pathname === href ? " bg-primary text-white" : "")
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  );
}

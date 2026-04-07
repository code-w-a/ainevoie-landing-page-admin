"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

function FlagRo({
  className,
  gradientId,
}: {
  className?: string;
  gradientId: string;
}) {
  return (
    <svg
      viewBox="0 0 1 1"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#002B7F" />
          <stop offset="0.34" stopColor="#002B7F" />
          <stop offset="0.34" stopColor="#FCD116" />
          <stop offset="0.67" stopColor="#FCD116" />
          <stop offset="0.67" stopColor="#CE1126" />
          <stop offset="1" stopColor="#CE1126" />
        </linearGradient>
      </defs>
      <circle cx="0.5" cy="0.5" r="0.5" fill={`url(#${gradientId})`} />
    </svg>
  );
}

function FlagEn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1 1"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <circle cx="0.5" cy="0.5" r="0.5" fill="#012169" />
      <path
        d="M0 0 L1 1 M1 0 L0 1"
        stroke="white"
        strokeWidth="0.22"
        strokeLinecap="square"
      />
      <path
        d="M0 0 L1 1 M1 0 L0 1"
        stroke="#C8102E"
        strokeWidth="0.1"
        strokeLinecap="square"
      />
      <path d="M0.5 0 V1 M0 0.5 H1" stroke="white" strokeWidth="0.2" />
      <path d="M0.5 0 V1 M0 0.5 H1" stroke="#C8102E" strokeWidth="0.12" />
    </svg>
  );
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");
  const roGradientId = useId().replace(/:/g, "");

  const targetLocale = locale === "ro" ? "en" : "ro";
  const ariaLabel = targetLocale === "en" ? t("switchToEn") : t("switchToRo");

  return (
    <Link
      href={pathname}
      locale={targetLocale}
      scroll={false}
      className={cn(
        "relative mr-2 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-border bg-background shadow-sm ring-1 ring-black/5",
        "transition hover:ring-2 hover:ring-primary/35 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        "dark:ring-white/10 dark:hover:ring-primary/45"
      )}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        {locale === "en" ? (
          <FlagEn />
        ) : (
          <FlagRo gradientId={roGradientId} />
        )}
      </span>
    </Link>
  );
}

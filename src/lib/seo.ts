import type { Metadata } from "next";

import { routing } from "@/i18n/routing";

const SITE_NAME = "AInevoie";

/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. https://www.example.com).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      /* invalid */
    }
  }
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}

/**
 * Path without locale prefix (e.g. "/", "/privacy", "/blog/post-slug").
 */
export function localizedPath(locale: string, path: string): string {
  const normalized =
    path === "" || path === "/" ?
      "/"
    : path.startsWith("/") ?
      path
    : `/${path}`;

  if (locale === routing.defaultLocale) {
    return normalized;
  }
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function buildLocalePageMetadata(
  locale: string,
  path: string,
  options: {
    title: string;
    description: string;
    robotsIndex?: boolean;
  }
): Metadata {
  const base = getMetadataBase();
  const canonical = new URL(localizedPath(locale, path), base).toString();
  const roUrl = new URL(localizedPath("ro", path), base).toString();
  const enUrl = new URL(localizedPath("en", path), base).toString();
  const xDefault = new URL(
    localizedPath(routing.defaultLocale, path),
    base
  ).toString();

  const robotsIndex = options.robotsIndex !== false;

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical,
      languages: {
        ro: roUrl,
        en: enUrl,
        "x-default": xDefault,
      },
    },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_US" : "ro_RO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
    },
    ...(robotsIndex ?
      {}
    : {
        robots: {
          index: false,
          follow: true,
        },
      }),
  };
}

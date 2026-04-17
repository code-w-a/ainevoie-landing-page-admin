import type { MetadataRoute } from "next";

import { getPostSlugs } from "@/lib/markdown";
import { routing } from "@/i18n/routing";
import { getSiteUrl, localizedPath } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/privacy",
  "/terms",
  "/cookies",
  "/gdpr",
  "/blog",
  "/docs",
  "/providers/onboarding",
  "/providers/onboarding/form",
  "/providers/onboarding/success",
] as const;

function listDocSlugs(): string[] {
  try {
    return getPostSlugs().map((name) => name.replace(/\.mdx$/i, ""));
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const baseUrl = new URL(base);
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      const loc = localizedPath(locale, path);
      const url = new URL(loc, baseUrl).toString();
      entries.push({
        url,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.8,
      });
    }

    for (const slug of listDocSlugs()) {
      const loc = localizedPath(locale, `/docs/${slug}`);
      entries.push({
        url: new URL(loc, baseUrl).toString(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

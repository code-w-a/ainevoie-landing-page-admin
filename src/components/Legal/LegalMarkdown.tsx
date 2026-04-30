import markdownToHtml from "@/lib/markdownToHtml";
import { routing, type AppLocale } from "@/i18n/routing";
import { readFile } from "fs/promises";
import path from "path";

export type LegalMarkdownSlug = "terms" | "privacy" | "cookies" | "gdpr";

type Props = {
  slug: LegalMarkdownSlug;
  locale?: AppLocale | string;
};

function resolveLocale(locale?: AppLocale | string): AppLocale {
  return routing.locales.includes(locale as AppLocale) ? (locale as AppLocale) : "en";
}

export async function LegalMarkdown({ slug, locale = "en" }: Props) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "legal",
    resolveLocale(locale),
    `${slug}.md`
  );
  const md = await readFile(filePath, "utf8");
  const html = await markdownToHtml(md);
  return (
    <div
      className="legal-markdown prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-body prose-li:text-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

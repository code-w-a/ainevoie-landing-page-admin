import markdownToHtml from "@/lib/markdownToHtml";
import { readFile } from "fs/promises";
import path from "path";

export type LegalMarkdownSlug = "terms" | "privacy" | "cookies" | "gdpr";

type Props = {
  slug: LegalMarkdownSlug;
};

export async function LegalMarkdown({ slug }: Props) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "legal",
    "en",
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

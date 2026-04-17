import { structuredAlgoliaHtmlData } from "@/lib/crawlIndex";
import { routing } from "@/i18n/routing";
import { getPostBySlug } from "@/lib/markdown";
import { buildLocalePageMetadata } from "@/lib/seo";
import markdownToHtml from "@/lib/markdownToHtml";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { locale, slug } = params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Docs" });
  const post = getPostBySlug(slug, ["title", "author", "content"]);
  const siteName = process.env.SITE_NAME;
  const authorName = process.env.AUTHOR_NAME;

  const docPath = `/docs/${slug}`;

  if (post) {
    const title = `${post.title || t("postFallbackTitle")} | ${siteName}`;
    const description = `${String(post.metadata || "").slice(0, 136)}...`;
    return {
      ...buildLocalePageMetadata(locale, docPath, { title, description }),
      authors: authorName ? [{ name: authorName }] : undefined,
    };
  }
  return buildLocalePageMetadata(locale, docPath, {
    title: t("postNotFoundMetaTitle"),
    description: t("postNotFoundMetaDescription"),
    robotsIndex: false,
  });
}

export default async function DocsPost(props: Props) {
  const { locale, slug } = await props.params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const post = getPostBySlug(slug, ["title", "author", "content"]);

  if (!post) notFound();

  const content = await markdownToHtml(post.content || "");

  await structuredAlgoliaHtmlData({
    type: "docs",
    title: post?.title,
    htmlString: content,
    pageUrl: `${process.env.SITE_URL}/docs/${slug}`,
    imageURL: "",
  });

  return <article dangerouslySetInnerHTML={{ __html: content }} />;
}

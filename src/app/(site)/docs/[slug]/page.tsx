import { structuredAlgoliaHtmlData } from "@/lib/crawlIndex";
import { getPostBySlug } from "@/lib/markdown";
import markdownToHtml from "@/lib/markdownToHtml";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const post = getPostBySlug(params.slug, ["title", "author", "content"]);
  const siteName = process.env.SITE_NAME;
  const authorName = process.env.AUTHOR_NAME;

  if (post) {
    return {
      title: `${post.title || "Single Post Page"} | ${siteName}`,
      description: `${post.metadata?.slice(0, 136)}...`,
      author: authorName,

      robots: {
        index: true,
        follow: true,
        nocache: true,
        googleBot: {
          index: true,
          follow: false,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } else {
    return {
      title: "Nu am găsit documentul",
      description: "Documentul căutat nu există sau nu mai este disponibil.",
    };
  }
}

export default async function DocsPost(props: Props) {
  const { slug } = await props.params;

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

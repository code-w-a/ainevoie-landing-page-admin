import BlogItem from "@/components/Blog/BlogItem";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo";
import {
  getAuthorBySlug,
  getPostsByAuthor,
  imageBuilder,
  isSanityConfigured,
} from "@/sanity/sanity-utils";
import { Author } from "@/types/blog";
import { messages } from "@integrations-config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { locale, slug } = params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  if (!isSanityConfigured) {
    return buildLocalePageMetadata(locale, "/blog", {
      title: t("blogMetaTitle"),
      description: t("blogUnavailableDescription"),
    });
  }
  const author = (await getAuthorBySlug(slug)) as Author;
  const authorName = process.env.AUTHOR_NAME;

  if (author) {
    const path = `/blog/author/${slug}`;
    const title = `${author.name || "Author Page"} | Ainevoie`;
    const description = String(author.bio || "").slice(0, 160) || title;
    const base = buildLocalePageMetadata(locale, path, {
      title,
      description,
      robotsIndex: false,
    });
    const imageUrlRaw = author.image ? imageBuilder(author.image).url() : "";
    const imageUrl = typeof imageUrlRaw === "string" && imageUrlRaw ? imageUrlRaw : "";

    return {
      ...base,
      authors: authorName ? [{ name: authorName }] : undefined,
      openGraph: {
        ...base.openGraph,
        type: "article",
        ...(imageUrl ?
          {
            images: [
              {
                url: imageUrl,
                width: 343,
                height: 343,
                alt: author.name || "",
              },
            ],
          }
        : {}),
      },
      twitter: {
        ...base.twitter,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    };
  }

  return buildLocalePageMetadata(locale, `/blog/author/${slug}`, {
    title: "Autor negăsit | Ainevoie",
    description: "Autorul căutat nu există sau nu mai este disponibil.",
    robotsIndex: false,
  });
}

const BlogGrid = async (props: Props) => {
  const params = await props.params;
  const { locale, slug } = params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  if (!isSanityConfigured) {
    return <main className="container max-w-[1400px] pt-[150px] pb-[60px] lg:pt-[220px]">{messages.sanity}</main>;
  }

  const author = (await getAuthorBySlug(slug)) as Author;
  if (!author) notFound();
  const posts = await getPostsByAuthor(slug);

  return (
    <main className="container max-w-[1400px] pt-[150px] pb-[60px] lg:pt-[220px]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] gap-5 lg:gap-8">
        {/* Blog Item */}
        {posts?.length > 0 ? (
          posts?.map((item, key) => <BlogItem key={key} blog={item} />)
        ) : (
          <p>Nu există articole disponibile.</p>
        )}
      </div>
    </main>
  );
};

export default BlogGrid;

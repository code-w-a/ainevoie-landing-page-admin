import BlogItem from "@/components/Blog/BlogItem";
import {
  getAuthorBySlug,
  getPostsByAuthor,
  imageBuilder,
  isSanityConfigured,
} from "@/sanity/sanity-utils";
import { Author } from "@/types/blog";
import { messages } from "@integrations-config";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { slug } = params;
  if (!isSanityConfigured) {
    return {
      title: "Blog | AInevoie",
      description: "Blogul AInevoie nu este disponibil momentan.",
    };
  }
  const author = (await getAuthorBySlug(slug)) as Author;
  const siteURL = process.env.SITE_URL;
  const authorName = process.env.AUTHOR_NAME;

  if (author) {
    return {
      title: `${
        author.name || "Author Page"
      } | ${authorName} — AInevoie`,
      description: author.bio,
      author: authorName,

      robots: {
        index: false,
        follow: false,
        nocache: true,
      },

      openGraph: {
        title: `${author.name} | ${authorName}`,
        description: author.bio,
        url: `${siteURL}/blog/author/${slug}`,
        siteName: authorName,
        images: [
          {
            url: imageBuilder(author.image).url(),
            width: 343,
            height: 343,
            alt: author.name,
          },
        ],
        locale: "en_US",
        type: "article",
      },

      twitter: {
        card: "summary_large_image",
        title: `${author.name} | ${authorName}`,
        description: `${author.bio?.slice(0, 136)}...`,
        creator: `@${authorName}`,
        site: `@${authorName}`,
        images: [imageBuilder(author.image).url()],
        url: `${siteURL}/blog/author/${slug}`,
      },
    };
  } else {
    return {
      title: "Autor negăsit",
      description: "Autorul căutat nu există sau nu mai este disponibil.",
    };
  }
}

const BlogGrid = async (props: Props) => {
  const params = await props.params;
  const { slug } = params;

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

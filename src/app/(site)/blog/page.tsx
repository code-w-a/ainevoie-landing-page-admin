import BlogItem from "@/components/Blog/BlogItem";
import { getPosts, isSanityConfigured } from "@/sanity/sanity-utils";
import { integrations, messages } from "@integrations-config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Blog | ${process.env.SITE_NAME}`,
  description: `Articole și noutăți de la ${process.env.SITE_NAME}.`,
};

const BlogGrid = async () => {
  const posts = isSanityConfigured ? await getPosts() : [];

  return (
    <main className="container max-w-[1400px] pt-[150px] pb-[60px] lg:pt-[220px]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] gap-5 lg:gap-8">
        {integrations?.isSanityEnabled && isSanityConfigured ? (
          posts?.map((item, key) => <BlogItem key={key} blog={item} />)
        ) : (
          <div>{messages.sanity}</div>
        )}
      </div>
    </main>
  );
};

export default BlogGrid;

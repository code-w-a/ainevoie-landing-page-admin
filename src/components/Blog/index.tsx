import BlogItem from "@/components/Blog/BlogItem";
import { getPosts } from "@/sanity/sanity-utils";
import { getLocale, getTranslations } from "next-intl/server";

const Blog = async () => {
  const locale = await getLocale();
  const posts = await getPosts(locale);
  const t = await getTranslations("Blog");

  return (
    <section className="pt-[110px] pb-[60px]" id="blog">
      <div className="container">
        <div
          className="wow fadeInUp mx-auto mb-14 max-w-[690px] text-center lg:mb-[70px]"
          data-wow-delay=".2s"
        >
          <h2 className="mb-4 text-3xl font-bold text-black sm:text-4xl md:text-[44px] md:leading-tight dark:text-white">
            {t("sectionTitle")}
          </h2>
          <p className="text-body text-base">{t("sectionSubtitle")}</p>
          {locale === "en" && (
            <p className="text-body mt-4 text-sm">{t("localeNote")}</p>
          )}
        </div>
      </div>

      <div className="container max-w-[1400px] pb-[60px]">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] gap-5 lg:gap-8">
          {posts?.length ? (
            posts
              ?.slice(0, 3)
              .map((item) => <BlogItem blog={item} key={item.slug.current} />)
          ) : (
            <p>{t("sectionEmpty")}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Blog;

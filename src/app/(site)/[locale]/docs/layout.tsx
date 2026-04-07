import SidebarLink from "@/components/Docs/SidebarLink";
import { getAllPosts } from "@/lib/markdown";
import { PropsWithChildren } from "react";

export default function DocsLayout({ children }: PropsWithChildren) {
  const posts = getAllPosts(["title", "date", "excerpt", "coverImage", "slug"]);

  return (
    <div className="container pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24">
      <div className="grid grid-cols-[auto_1fr] gap-8">
        <aside className="dark:border-stroke-dark sticky top-[74px] max-h-fit rounded-lg border border-white p-4 shadow-sm dark:bg-black">
          <ul className="space-y-2">
            {posts.map((post) => (
              <SidebarLink
                slug={post.slug}
                title={post.title}
                key={post.slug}
              />
            ))}
          </ul>
        </aside>

        <main className="prose dark:prose-invert dark:border-stroke-dark dark:bg-gray-dark max-h-fit max-w-none rounded-lg border border-white px-8 py-11 shadow-sm sm:p-[55px] lg:px-8 xl:p-[55px]">
          {children}
        </main>
      </div>
    </div>
  );
}

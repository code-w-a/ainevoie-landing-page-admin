"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PropsType = {
  slug: string;
  title: string;
};

const SidebarLink = ({ slug, title }: PropsType) => {
  const pathUrl = usePathname();

  return (
    <li>
      <Link
        href={`/docs/${slug}`}
        className={`hover:bg-stroke hover:text-dark dark:hover:bg-stroke-dark flex w-full rounded-sm px-3 py-2 text-base ${
          pathUrl === `/docs/${slug}`
            ? "bg-stroke dark:bg-stroke-dark text-black dark:text-white"
            : "bg-white text-black/65 dark:bg-black dark:text-white"
        }`}
      >
        {title}
      </Link>
    </li>
  );
};

export default SidebarLink;

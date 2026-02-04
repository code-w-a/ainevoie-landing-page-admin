import Image from "next/image";
import Link from "next/link";
import { Highlight } from "react-instantsearch";

function CustomHits(props: any) {
  const { hit, setSearchModalOpen } = props;

  return (
    <div className="relative grid grid-cols-[auto_1fr] items-center px-[22px] py-4 duration-300 hover:bg-[#F9FAFB] dark:hover:bg-[#1F233A]">
      {hit?.imageURL && (
        <Image
          src={hit.imageURL}
          className="mr-4 h-[60px] w-[106px] rounded-lg object-cover object-center"
          role="presentation"
          alt="Cover image"
          height={60}
          width={106}
          quality={100}
        />
      )}

      <div className="col-start-2">
        <h3 className="text-base font-medium text-black dark:text-white">
          <Link
            onClick={() => setSearchModalOpen(false)}
            href={hit?.objectID || hit?.url}
          >
            <span className="absolute inset-0" aria-hidden />
            <Highlight attribute="title" hit={hit} />
          </Link>
        </h3>

        <div className="text-body flex gap-[0.3ch] text-sm">
          <Highlight attribute="type" hit={hit} />
          {" : "}

          <Highlight
            classNames={{
              root: "line-clamp-1",
            }}
            attribute="url"
            hit={hit}
          />
        </div>
      </div>
    </div>
  );
}
export default CustomHits;

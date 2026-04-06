import Image from "next/image";

type PhoneMockupProps = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
};

const PhoneMockup = ({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 320px, (min-width: 768px) 300px, 260px",
}: PhoneMockupProps) => {
  return (
    <div className="relative mx-auto w-full max-w-[320px] px-2 py-4">
      <div className="pointer-events-none absolute top-24 -left-[1px] h-10 w-[3px] rounded-full bg-slate-300/80 shadow-sm dark:bg-slate-700/80" />
      <div className="pointer-events-none absolute top-36 -left-[1px] h-16 w-[3px] rounded-full bg-slate-300/80 shadow-sm dark:bg-slate-700/80" />
      <div className="pointer-events-none absolute top-28 -right-[1px] h-20 w-[3px] rounded-full bg-slate-300/80 shadow-sm dark:bg-slate-700/80" />

      <div className="relative rounded-[2.9rem] bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 p-[5px] shadow-[0_35px_90px_rgba(15,23,42,0.18)] dark:from-slate-500 dark:via-slate-700 dark:to-slate-900">
        <div className="relative rounded-[2.65rem] bg-slate-950 px-[7px] pt-10 pb-[7px]">
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
            <div className="flex h-6 w-28 items-center justify-center rounded-full bg-slate-950/95 ring-1 ring-white/5">
              <div className="h-1.5 w-14 rounded-full bg-slate-800" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2.25rem] bg-black">
            <Image
              width={1080}
              height={2316}
              src={src}
              alt={alt}
              priority={priority}
              sizes={sizes}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;

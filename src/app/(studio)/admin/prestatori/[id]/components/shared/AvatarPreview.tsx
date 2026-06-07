import { getInitials } from "@/lib/adminProviderDetail";

export function AvatarPreview({
  src,
  loading,
  name,
  size = "lg",
}: {
  src: string | null;
  loading: boolean;
  name: string;
  size?: "sm" | "lg";
}) {
  const className =
    size === "sm"
      ? "h-16 w-16 text-lg"
      : "h-40 w-full min-w-[160px] max-w-[220px] text-3xl";

  return (
    <div className={`flex ${className} items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 font-semibold text-muted-foreground`}>
      {loading ? (
        <p className="px-3 text-center text-xs font-normal">Se încarcă...</p>
      ) : src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Imagine profil prestator" className="h-full w-full object-cover" />
        </>
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

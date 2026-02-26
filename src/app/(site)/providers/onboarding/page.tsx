import ProviderIntroHero from "@/components/providers/intro/ProviderIntroHero";
import ProviderIntroValueProps from "@/components/providers/intro/ProviderIntroValueProps";

export default function ProviderOnboardingIntroPage() {
  return (
    <main className="pb-16 sm:pb-24">
      <section className="container lg:max-w-[1305px] lg:px-10">
        <ProviderIntroHero />
        <ProviderIntroValueProps />
      </section>
    </main>
  );
}

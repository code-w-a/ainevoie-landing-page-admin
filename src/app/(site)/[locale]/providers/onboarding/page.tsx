import ProviderIntroFinalCta from "@/components/providers/intro/ProviderIntroFinalCta";
import ProviderIntroHero from "@/components/providers/intro/ProviderIntroHero";
import ProviderIntroNextSteps from "@/components/providers/intro/ProviderIntroNextSteps";
import ProviderIntroSteps from "@/components/providers/intro/ProviderIntroSteps";
import ProviderIntroValueProps from "@/components/providers/intro/ProviderIntroValueProps";

export default function ProviderOnboardingIntroPage() {
  return (
    <main className="pb-16 sm:pb-24">
      <section className="container lg:max-w-[1305px] lg:px-10">
        <ProviderIntroHero />
        <ProviderIntroSteps />
        <ProviderIntroValueProps />
        <ProviderIntroNextSteps />
        <ProviderIntroFinalCta />
      </section>
    </main>
  );
}

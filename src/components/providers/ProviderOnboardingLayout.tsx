type ProviderOnboardingLayoutProps = {
  form: React.ReactNode;
  side: React.ReactNode;
};

export default function ProviderOnboardingLayout({
  form,
  side,
}: ProviderOnboardingLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-8">{form}</div>
      <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
        {side}
      </aside>
    </div>
  );
}

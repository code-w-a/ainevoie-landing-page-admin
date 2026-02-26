"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart2,
  ChevronDown,
  Mail,
  BriefcaseBusiness,
  Settings,
  Users,
} from "lucide-react";

const newsletterItems = [
  { href: "/admin", label: "Sumar", icon: BarChart2 },
  { href: "/admin/campaigns", label: "Campanii", icon: Mail },
  { href: "/admin/subscribers", label: "Abonați", icon: Users },
  { href: "/admin/logs", label: "Loguri", icon: Activity },
  { href: "/admin/settings", label: "Setări", icon: Settings },
];

const providerItems = [
  { href: "/admin/prestatori", label: "Prestatori", icon: BriefcaseBusiness },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isNewsletterRoute = pathname.startsWith("/admin");
  const isProviderRoute = pathname.startsWith("/admin/prestatori");
  const [newsletterOpen, setNewsletterOpen] = useState(isNewsletterRoute);
  const [providerOpen, setProviderOpen] = useState(isProviderRoute);
  const isNewsletterActive = useMemo(
    () => newsletterItems.some((item) => item.href === pathname),
    [pathname]
  );
  const isProviderActive = useMemo(
    () => providerItems.some((item) => pathname.startsWith(item.href)),
    [pathname]
  );

  return (
    <aside className="hidden w-64 border-r border-border bg-background/90 px-4 py-6 backdrop-blur md:block">
      <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          A
        </span>
        <span>AInevoie Admin</span>
      </div>

      <nav className="space-y-4">
        <button
          type="button"
          onClick={() => setNewsletterOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
            isNewsletterActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span className="font-medium">Newsletter</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              newsletterOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {newsletterOpen && (
          <div className="space-y-1 pl-1">
            {newsletterItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setProviderOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
            isProviderActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span className="font-medium">Prestatori</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              providerOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {providerOpen && (
          <div className="space-y-1 pl-1">
            {providerItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

    </aside>
  );
}

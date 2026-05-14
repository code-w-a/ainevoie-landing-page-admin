"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart2,
  CalendarClock,
  ChevronDown,
  CreditCard,
  LifeBuoy,
  Mail,
  MessageSquare,
  BriefcaseBusiness,
  LayoutDashboard,
  Settings,
  Star,
  Users,
} from "lucide-react";

const operationsItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/prestatori", label: "Prestatori", icon: BriefcaseBusiness },
  { href: "/admin/utilizatori", label: "Utilizatori", icon: Users },
  { href: "/admin/programari", label: "Programări", icon: CalendarClock },
  { href: "/admin/plati", label: "Plăți", icon: CreditCard },
  { href: "/admin/recenzii", label: "Recenzii", icon: Star },
  { href: "/admin/conversatii", label: "Conversații", icon: MessageSquare },
  { href: "/admin/suport", label: "Suport", icon: LifeBuoy },
  { href: "/admin/settings", label: "Setări", icon: Settings },
];

const newsletterItems = [
  { href: "/admin/newsletter", label: "Sumar newsletter", icon: BarChart2 },
  { href: "/admin/campaigns", label: "Campanii", icon: Mail },
  { href: "/admin/subscribers", label: "Abonați", icon: Users },
  { href: "/admin/logs", label: "Loguri", icon: Activity },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isOperationsRoute = useMemo(
    () =>
      operationsItems.some((item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href)
      ),
    [pathname]
  );
  const isNewsletterRoute = useMemo(
    () => newsletterItems.some((item) => pathname.startsWith(item.href)),
    [pathname]
  );
  const [operationsOpen, setOperationsOpen] = useState(isOperationsRoute);
  const [newsletterOpen, setNewsletterOpen] = useState(isNewsletterRoute);
  const isOperationsActive = isOperationsRoute;
  const isNewsletterActive = useMemo(
    () => newsletterItems.some((item) => pathname.startsWith(item.href)),
    [pathname]
  );

  return (
    <aside className="hidden w-64 border-r border-border bg-background/90 px-4 py-6 backdrop-blur md:block">
      <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          A
        </span>
        <span>Ainevoie Admin</span>
      </div>

      <nav className="space-y-4">
        <button
          type="button"
          onClick={() => setOperationsOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
            isOperationsActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span className="font-medium">Operațiuni</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              operationsOpen || isOperationsActive ? "rotate-180" : ""
            }`}
          />
        </button>

        {(operationsOpen || isOperationsActive) && (
          <div className="space-y-1 pl-1">
            {operationsItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
              newsletterOpen || isNewsletterActive ? "rotate-180" : ""
            }`}
          />
        </button>

        {(newsletterOpen || isNewsletterActive) && (
          <div className="space-y-1 pl-1">
            {newsletterItems.map((item) => {
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

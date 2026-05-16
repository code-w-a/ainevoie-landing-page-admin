"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminNotificationsMenu } from "@/components/admin/AdminNotificationsMenu";
import AdminUserMenu from "@/components/admin/AdminUserMenu";
import { Input } from "@/components/ui/input";

type AdminSearchItem = {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  meta?: string | null;
};

type AdminSearchGroup = {
  type: string;
  label: string;
  items: AdminSearchItem[];
};

type AdminSearchResponse = {
  groups?: AdminSearchGroup[];
  total?: number;
};

export default function AdminTopbar() {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<AdminSearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const totalResults = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups]
  );

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminFetch(
          `/api/admin/search?q=${encodeURIComponent(trimmedQuery)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(await readAdminResponseError(response, "Căutarea a eșuat."));
        }
        const payload = (await response.json()) as AdminSearchResponse;
        setGroups(payload.groups || []);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Căutarea a eșuat.");
        setGroups([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [hasQuery, trimmedQuery]);

  return (
    <header className="border-b border-border bg-background/90 px-6 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
        <div ref={wrapperRef} className="relative w-full max-w-md">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              className="border-none bg-transparent pl-2 pr-2 focus-visible:ring-0"
              placeholder="Caută email, telefon, booking ID, payment ID..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                if (hasQuery) {
                  setOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpen(false);
                  event.currentTarget.blur();
                }
              }}
            />
          </div>

          {open && hasQuery && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
              <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                {loading
                  ? "Caut..."
                  : error
                    ? error
                    : totalResults
                      ? `${totalResults} rezultate pentru “${trimmedQuery}”`
                      : `Niciun rezultat pentru “${trimmedQuery}”`}
              </div>

              <div className="max-h-[520px] overflow-y-auto py-2">
                {groups.map((group) => (
                  <div key={group.type} className="py-1">
                    <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={`${group.type}-${item.id}`}
                          href={item.href}
                          className="block px-3 py-2 text-sm transition-colors hover:bg-muted"
                          onClick={() => setOpen(false)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-medium">{item.title}</span>
                            {item.meta ? (
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                {item.meta}
                              </span>
                            ) : null}
                          </div>
                          {item.subtitle ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {!loading && !error && groups.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Caută după email, telefon, nume, booking ID, payment ID, ticket ID sau conversation ID.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <AdminNotificationsMenu />
          <AdminUserMenu />
        </div>
      </div>
    </header>
  );
}

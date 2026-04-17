"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";

import { adminFetch } from "@/components/admin/adminApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { subscriberStatusLabel } from "@/lib/adminLabels";
import {
  clearSeenLocal,
  loadSeen,
  mergeSeenStates,
  normalizeSeenFromUnknown,
  type AdminNotificationsSeen,
} from "@/lib/adminNotificationsSeen";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import {
  isProviderStatus,
  providerStatusLabel,
  providerStatusVariant,
} from "@/lib/providers";
import { cn } from "@/lib/utils";

type SignupsFeedResponse = {
  newSubscribers: Array<{
    id?: string;
    email?: string;
    createdAt?: string;
    status?: string;
  }>;
  newProviders: Array<{
    id?: string;
    fullName?: string;
    email?: string;
    createdAt?: string;
    onboardingStatus?: string;
  }>;
};

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

function providerOnboardingLabel(status?: string | null) {
  if (status && isProviderStatus(status)) {
    return providerStatusLabel[status];
  }
  return status || "—";
}

export function AdminNotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState<SignupsFeedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteSeen, setRemoteSeen] = useState<AdminNotificationsSeen | null>(null);
  const [seenSyncError, setSeenSyncError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchSignups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/newsletter/recent-activity", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("failed");
      }
      const json = (await res.json()) as SignupsFeedResponse;
      setRaw({
        newSubscribers: Array.isArray(json.newSubscribers) ?
          json.newSubscribers
        : [],
        newProviders: Array.isArray(json.newProviders) ? json.newProviders : [],
      });
    } catch {
      setError("Nu am putut încărca înregistrările.");
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeen = useCallback(async () => {
    setSeenSyncError(null);
    try {
      const res = await adminFetch("/api/admin/notifications-seen", { cache: "no-store" });
      if (res.status === 401) {
        setRemoteSeen(null);
        return;
      }
      if (!res.ok) {
        throw new Error("failed");
      }
      const json = (await res.json()) as unknown;
      const server = normalizeSeenFromUnknown(
        json && typeof json === "object" ? (json as Record<string, unknown>) : {}
      );
      const local = loadSeen();
      const needsMigrate =
        local.subscriberIds.some((id) => id && !server.subscriberIds.includes(id)) ||
        local.providerIds.some((id) => id && !server.providerIds.includes(id));

      if (needsMigrate) {
        const mRes = await adminFetch("/api/admin/notifications-seen", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriberIds: local.subscriberIds,
            providerIds: local.providerIds,
          }),
        });
        if (!mRes.ok) {
          setRemoteSeen(null);
          setSeenSyncError("Starea citit din browser nu a putut fi sincronizată cu serverul.");
          return;
        }
        const mergedJson = (await mRes.json()) as unknown;
        setRemoteSeen(
          normalizeSeenFromUnknown(
            mergedJson && typeof mergedJson === "object" ?
              (mergedJson as Record<string, unknown>)
            : {}
          )
        );
        clearSeenLocal();
        return;
      }

      setRemoteSeen(server);
      clearSeenLocal();
    } catch {
      setSeenSyncError("Nu am putut încărca starea citit de pe server (folosim temporar browserul).");
      setRemoteSeen(null);
    }
  }, []);

  useEffect(() => {
    void fetchSignups();
    void fetchSeen();
  }, [fetchSignups, fetchSeen]);

  useEffect(() => {
    if (open) {
      void fetchSignups();
      void fetchSeen();
    }
  }, [open, fetchSignups, fetchSeen]);

  const seen = useMemo(() => {
    if (!remoteSeen) {
      return loadSeen();
    }
    return mergeSeenStates(remoteSeen, loadSeen());
  }, [remoteSeen]);

  const { unreadSubscribers, unreadProviders } = useMemo(() => {
    const subSeen = new Set(seen.subscriberIds);
    const provSeen = new Set(seen.providerIds);
    const subscribers = (raw?.newSubscribers ?? []).filter(
      (r) => typeof r.id === "string" && r.id && !subSeen.has(r.id)
    );
    const providers = (raw?.newProviders ?? []).filter(
      (r) => typeof r.id === "string" && r.id && !provSeen.has(r.id)
    );
    return {
      unreadSubscribers: subscribers,
      unreadProviders: providers,
    };
  }, [raw, seen]);

  const unreadCount =
    unreadSubscribers.length + unreadProviders.length;
  const hasUnread = unreadCount > 0;

  async function handleMarkAllRead() {
    if (!hasUnread || markingRead) {
      return;
    }
    const subscriberIds = unreadSubscribers
      .map((s) => s.id)
      .filter((id): id is string => Boolean(id));
    const providerIds = unreadProviders
      .map((p) => p.id)
      .filter((id): id is string => Boolean(id));
    setMarkingRead(true);
    try {
      const res = await adminFetch("/api/admin/notifications-seen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberIds, providerIds }),
      });
      if (!res.ok) {
        toast.error("Nu am putut salva „citit” pe server. Încearcă din nou.");
        return;
      }
      const json = (await res.json()) as unknown;
      setRemoteSeen(
        normalizeSeenFromUnknown(
          json && typeof json === "object" ? (json as Record<string, unknown>) : {}
        )
      );
      clearSeenLocal();
    } catch {
      toast.error("Nu am putut salva „citit” pe server. Încearcă din nou.");
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={
            hasUnread ?
              `Înregistrări noi în admin, ${unreadCount} necitite`
            : "Înregistrări noi în admin"
          }
        >
          <Bell className="h-4 w-4" />
          {hasUnread ?
            <span
              className={cn(
                "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full",
                "bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background"
              )}
              aria-hidden
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,400px)] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Înregistrări noi</p>
          <p className="text-xs text-muted-foreground">
            Abonați și prestatori înscriși recent. Marchează ca citite — starea se salvează în
            cont și se sincronizează între dispozitive.
          </p>
          {seenSyncError ?
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">{seenSyncError}</p>
          : null}
        </div>

        <div className="max-h-[min(70vh,440px)] overflow-y-auto overscroll-contain px-2 py-2">
          {loading && !raw && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Se încarcă…
            </p>
          )}
          {error && !raw && !loading && (
            <p className="px-2 py-4 text-center text-sm text-rose-600">{error}</p>
          )}
          {raw && (
            <div className="space-y-4">
              <section>
                <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Abonați noi
                </h3>
                {unreadSubscribers.length === 0 ?
                  <p className="px-1 text-sm text-muted-foreground">
                    Niciun abonat nou de arătat.
                  </p>
                : unreadSubscribers.map((s, i) => (
                    <Link
                      key={s.id || `s-${i}`}
                      href="/admin/subscribers"
                      className="block rounded-md border border-transparent px-2 py-2 text-sm hover:bg-muted/60"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {s.status ?
                          <Badge variant="secondary" className="text-[10px]">
                            {subscriberStatusLabel(s.status)}
                          </Badge>
                        : null}
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatAdminDateTime(s.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium leading-snug">
                        {truncate(
                          typeof s.email === "string" ? s.email : "",
                          120
                        ) || "—"}
                      </p>
                    </Link>
                  ))
                }
              </section>

              <section>
                <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Prestatori noi
                </h3>
                {unreadProviders.length === 0 ?
                  <p className="px-1 text-sm text-muted-foreground">
                    Niciun prestator nou de arătat.
                  </p>
                : unreadProviders.map((p, i) => (
                    <Link
                      key={p.id || `p-${i}`}
                      href={`/admin/prestatori/${p.id}`}
                      className="block rounded-md border border-transparent px-2 py-2 text-sm hover:bg-muted/60"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={providerStatusVariant(p.onboardingStatus)}
                          className="text-[10px]"
                        >
                          {providerOnboardingLabel(p.onboardingStatus)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatAdminDateTime(p.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium leading-snug">
                        {truncate(
                          typeof p.fullName === "string" ? p.fullName : "",
                          80
                        ) || "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {truncate(
                          typeof p.email === "string" ? p.email : "",
                          120
                        )}
                      </p>
                    </Link>
                  ))
                }
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-border px-2 py-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={!hasUnread || markingRead}
            onClick={(e) => {
              e.preventDefault();
              void handleMarkAllRead();
            }}
          >
            {markingRead ? "Se salvează…" : "Marchează ca citite"}
          </Button>
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="flex flex-col gap-0.5 p-1">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/admin/subscribers">Toți abonații</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/admin/prestatori">Toți prestatorii</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/admin">Sumar dashboard</Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

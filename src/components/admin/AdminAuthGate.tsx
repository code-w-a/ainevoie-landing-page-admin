"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebaseClient";
import { adminFetch } from "@/components/admin/adminApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const auth = getFirebaseAuth();

    if (pathname !== "/admin/login") {
      setReady(false);
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (pathname === "/admin/login") {
        if (active) {
          setReady(true);
        }
        return;
      }

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const res = await adminFetch("/api/admin/auth/session").catch(() => null);
      if (!active) {
        return;
      }

      if (!res?.ok) {
        await signOut(auth);
        router.replace(
          `/admin/login?reason=${res?.status === 403 ? "forbidden" : "expired"}`
        );
        return;
      }

      if (active) {
        setReady(true);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [router, pathname]);

  if (!ready && pathname !== "/admin/login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-card p-6 shadow-sm">
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[85%]" />
          <Skeleton className="h-3 w-[65%]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
